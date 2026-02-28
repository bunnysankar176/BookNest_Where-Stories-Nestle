import ProfileForm from "../components/common/ProfileForm";
import ProtectedRoute from "../components/common/ProtectedRouteFixed";

function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileForm />
    </ProtectedRoute>
  );
}

export default ProfilePage;
