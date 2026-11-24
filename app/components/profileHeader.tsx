import { Link } from "react-router";
import Avatar from "./avatar";
import { profileName, type Profile } from "../data/profile";

type profileHeaderProps = {
  profile: Profile
  isOwnProfile: boolean
  // Extra content such as stats or a follow button
  stats?: React.ReactNode
  actions?: React.ReactNode
}

export default function ProfileHeader({ profile, isOwnProfile, stats, actions }: profileHeaderProps) {
  const name = profileName(profile);
  return (
    <section aria-labelledby="profile-name" className="rounded-2xl border border-stone-300 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar name={name} url={profile.avatar_url} size="xl" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 id="profile-name" className="truncate text-2xl font-bold sm:text-3xl">{name}</h1>
              <p className="text-stone-600">@{profile.username}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {actions}
              {isOwnProfile && (
                <Link
                  to="/settings"
                  className="inline-flex items-center rounded-full border-2 border-stone-300 bg-white px-5 py-2 text-sm font-bold hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Edit profile
                </Link>
              )}
            </div>
          </div>
          {profile.bio ? (
            <p className="whitespace-pre-line text-stone-800">{profile.bio}</p>
          ) : (
            isOwnProfile && <p className="text-sm text-stone-600">Add a bio in settings so people know who you are.</p>
          )}
          {stats}
        </div>
      </div>
    </section>
  );
}
