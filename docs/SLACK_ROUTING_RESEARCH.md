# Slack 단일 앱 + 멀티 OpenClaw 라우팅 리서치

**날짜:** 2026-02-18
**핵심 질문:** 하나의 Slack 앱(Bot Token 1개)으로 사용자별 DM을 각각 다른 OpenClaw 인스턴스로 라우팅할 수 있는가?

## 1. Slack Bot Token 권한 구조

- **하나의 Bot Token (`xoxb-...`)으로 모든 DM 수신 가능**: ✅ Yes
- Bot이 `im:history`, `im:read` 스코프를 가지면 모든 사용자의 DM을 받을 수 있음
- Event Subscriptions에서 `message.im` 이벤트를 구독하면 모든 DM이 하나의 endpoint로 전달됨
- 각 이벤트에 `event.user` (발신자 ID)가 포함되어 있어 사용자 식별 가능

## 2. Slack Events API 라우팅 가능성

### Events API (HTTP mode)
- Request URL로 지정된 단일 엔드포인트에 모든 이벤트가 POST됨
- 이벤트 payload 구조:
  ```json
  {
    "event": {
      "type": "message",
      "channel": "D01ABCDEF",  // DM 채널 ID
      "user": "U01234567",      // 발신자 Slack User ID
      "text": "hello",
      "ts": "1234567890.123456"
    }
  }
  ```
- **`user` 필드로 라우팅 가능**: ✅ 중앙 라우터가 user_id → OpenClaw 인스턴스 매핑 테이블을 참조하여 포워딩

### Socket Mode
- WebSocket 연결을 통해 이벤트를 수신
- 동일하게 `user` 필드 포함

## 3. OpenClaw의 Slack 연동 방식

### OpenClaw 지원 모드 (문서 확인 결과)

#### Socket Mode (기본)
- `appToken` (`xapp-...`) + `botToken` (`xoxb-...`) 필요
- OpenClaw 프로세스가 Slack에 WebSocket 연결을 맺음
- **제약: 하나의 App Token으로 여러 Socket 연결이 가능** (Slack은 Socket Mode에서 최대 10개 동시 연결 허용)
- 그러나 **모든 연결에 동일한 이벤트가 브로드캐스트됨** → 중복 처리 문제 발생

#### HTTP Mode (Events API)
- `botToken` + `signingSecret` 필요, `appToken` 불필요
- `webhookPath` 지정 (기본: `/slack/events`)
- Slack이 지정된 URL로 이벤트를 POST
- **중앙 라우터 패턴에 적합**: Request URL을 라우터로 지정하면 됨

#### Multi-Account 지원
- OpenClaw은 `channels.slack.accounts` 로 여러 Slack 앱 연결 지원
- 각 account에 별도 token, webhookPath 설정 가능
- 하지만 이것은 "여러 Slack 워크스페이스" 지원이지, "하나의 앱을 여러 인스턴스에서 공유"와는 다름

## 4. 현실적 제약사항

### ❌ 같은 Bot Token을 여러 OpenClaw 인스턴스에서 동시 사용

| 모드 | 동시 사용 가능? | 문제점 |
|------|---------------|--------|
| Socket Mode | ⚠️ 부분적 | 여러 연결 가능하나 모든 연결에 동일 이벤트 전달 → 중복 응답 위험 |
| HTTP Mode | ❌ 불가 | Request URL이 하나만 지정 가능 |

### 핵심 문제: Bot Token 공유의 한계
1. **Socket Mode**: 여러 인스턴스가 같은 토큰으로 연결하면 모든 인스턴스에 모든 메시지가 전달됨. 각 인스턴스가 자기 담당 사용자만 처리하도록 필터링은 가능하나, 응답도 모든 인스턴스가 같은 봇 토큰으로 보내므로 관리가 복잡함
2. **HTTP Mode**: Slack 앱 설정에서 Request URL은 하나만 지정 가능 → 직접 라우팅 불가

### DM 채널별 권한 분리
- ❌ 불가능. Bot Token은 workspace 전체에 대한 권한이며, 특정 DM만 선택적으로 수신하는 기능 없음

## 5. 아키텍처 옵션

### Option A: 중앙 라우터 패턴 (✅ 추천)

```
Slack App (1개)
    │
    ▼ (Events API / HTTP mode)
┌─────────────────────┐
│   Central Router    │  ← 이 플랫폼(openclaw-platform)이 담당
│   (우리 API 서버)    │
│                     │
│  user_id → instance │
│  mapping table      │
└─────────────────────┘
    │         │         │
    ▼         ▼         ▼
 OpenClaw  OpenClaw  OpenClaw
 (User A)  (User B)  (User C)
```

**구현 방식:**
1. Slack 앱을 HTTP mode로 설정, Request URL을 우리 라우터로 지정
2. 라우터가 이벤트 수신 → `event.user`로 담당 OpenClaw 인스턴스 조회
3. 해당 인스턴스의 OpenClaw에 메시지 전달 (HTTP forward 또는 내부 API)
4. OpenClaw 응답을 라우터가 받아서 Slack API로 전송 (같은 Bot Token 사용)

**장점:**
- Slack 앱 1개, Bot Token 1개로 운영
- 사용자-인스턴스 매핑을 중앙에서 관리
- 기존 openclaw-platform API에 통합 가능

**단점:**
- 라우터가 SPOF (Single Point of Failure)
- OpenClaw의 기본 Slack 연동을 직접 사용할 수 없음 (커스텀 연동 필요)
- 응답 지연 추가 (라우터 경유)

### Option B: OpenClaw HTTP Mode + Reverse Proxy

```
Slack App
    │
    ▼
  Nginx / ALB
  (path routing)
    │
    ├── /slack/events/user-001 → OpenClaw Instance 1
    ├── /slack/events/user-002 → OpenClaw Instance 2
    └── /slack/events/user-003 → OpenClaw Instance 3
```

**문제:** Slack은 Request URL을 하나만 지정 가능하므로 path 기반 분기 불가.
→ ❌ 이 방식은 직접 사용 불가. 앞단에 라우터가 필요하여 결국 Option A와 동일.

### Option C: 사용자별 Slack 앱 (N개 앱)

```
Slack App 1 (User A용) → OpenClaw Instance 1
Slack App 2 (User B용) → OpenClaw Instance 2
Slack App 3 (User C용) → OpenClaw Instance 3
```

**장점:**
- 각 OpenClaw이 독립적으로 Slack 연동 (Socket Mode 그대로 사용 가능)
- 완전한 격리
- 구현 가장 단순

**단점:**
- 사용자마다 별도 Slack 앱 필요 (관리 부담)
- 사용자가 각자 다른 봇에게 DM해야 함 (UX 저하)
- Slack 워크스페이스에 앱이 N개 설치됨

### Option D: 중앙 라우터 + OpenClaw HTTP Mode 조합

```
Slack App (1개, HTTP mode)
    │
    ▼
Central Router (우리 API)
    │
    ▼ (각 OpenClaw의 /slack/events 로 forward)
OpenClaw Instance (HTTP mode, 각자 signingSecret 검증 skip)
```

**핵심:** 라우터가 Slack 이벤트를 수신 → user_id로 대상 인스턴스 결정 → 해당 인스턴스의 OpenClaw HTTP webhook으로 그대로 forward.

**장점:**
- 각 OpenClaw이 기존 HTTP mode 연동을 그대로 사용
- 라우터는 단순 proxy 역할 (비즈니스 로직 최소)
- Bot Token을 각 OpenClaw에 동일하게 설정하면 응답도 각자 직접 전송

**단점:**
- signingSecret 검증은 라우터에서만 수행해야 함 (OpenClaw에서는 skip하거나 별도 처리)
- 같은 Bot Token으로 여러 인스턴스가 응답 → 충돌 가능성 낮지만 관리 필요

## 6. 결론

### 가능 여부: ✅ 가능 (단, 중앙 라우터 필수)

직접적으로 하나의 Bot Token을 여러 OpenClaw 인스턴스에서 독립적으로 사용하는 것은 **불가능**하다. 그러나 **중앙 라우터 패턴**을 도입하면 가능하다.

### 추천 아키텍처: Option D (중앙 라우터 + OpenClaw HTTP Mode)

**이유:**
1. 각 OpenClaw 인스턴스가 HTTP mode로 동작하므로 기존 Slack 연동 코드를 최대한 활용
2. 라우터는 단순 이벤트 프록시로, 우리 API 서버(openclaw-platform)에 통합 가능
3. Slack 앱은 1개만 필요
4. user_id → instance 매핑은 이미 우리 플랫폼 DB에 존재

### 구현 로드맵

1. **Phase 1**: 라우터 엔드포인트 추가 (`/slack/events` → user_id로 분기)
2. **Phase 2**: 각 EC2 인스턴스의 OpenClaw을 HTTP mode로 설정
3. **Phase 3**: Slack 앱의 Request URL을 라우터로 변경
4. **Phase 4**: 응답 토큰 관리 (Bot Token을 환경 변수로 각 인스턴스에 주입)

### 주의사항
- Socket Mode는 라우팅에 부적합 → HTTP mode 필수
- signing secret 검증은 라우터에서 1회만 수행
- 라우터 가용성이 전체 서비스 가용성에 직결 → HA 구성 권장
- OpenClaw의 세션 관리(`agent:main:slack:channel:<channelId>`)는 각 인스턴스 내부에서 독립적으로 동작하므로 충돌 없음
