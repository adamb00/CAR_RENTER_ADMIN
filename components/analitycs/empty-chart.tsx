export default function EmptyChart({ message }: { message: string }) {
  return (
    <div className='flex h-70 items-center justify-center rounded-lg border border-dashed px-4 text-sm text-muted-foreground'>
      {message}
    </div>
  );
}
