import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Session } from 'next-auth';

interface UserProfileProps {
  session: Session | null;
  onSignOut: () => void;
}

export default function UserProfile({ session, onSignOut }: UserProfileProps) {
  const router = useRouter();

  return (
    <div>
      {session ? (
        <div className="flex items-center justify-between bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span className="text-sm font-medium text-gray-700">
              {session.user?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSignOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="w-full bg-[#0a1172] text-white rounded-full py-3 px-4 hover:bg-[#0a1172]/90 transition-colors shadow-sm"
        >
          Sign In
        </button>
      )}
    </div>
  );
} 