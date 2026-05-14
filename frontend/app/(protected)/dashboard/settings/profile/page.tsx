import ProfilePage from "@/components/settings/profile";
import { getUser } from "@/app/actions/auth";

async function ProfileSettingsPage() {
  const user = await getUser();

  return (
    <div>
      <h1>Profile Settings</h1>
      <ProfilePage id={user?.id} email={user?.email} user_metadata={user?.user_metadata} />
      {/* Add your profile settings form or components here */}
    </div>
  );
}

export default ProfileSettingsPage;