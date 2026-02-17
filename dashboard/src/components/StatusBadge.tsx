const styles: Record<string, string> = {
  running: 'bg-green-500/20 text-green-400',
  stopped: 'bg-red-500/20 text-red-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  terminated: 'bg-gray-500/20 text-gray-400',
  not_created: 'bg-gray-500/20 text-gray-500',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.stopped}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
