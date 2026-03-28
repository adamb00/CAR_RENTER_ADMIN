import AddUserForm from '@/components/auth/add-user-form';

export default function page() {
  return (
    <div className='flex h-full flex-col gap-6 p-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight'>
          Rendszer szintű felhasználók
        </h1>
      </div>
      <AddUserForm />
    </div>
  );
}
