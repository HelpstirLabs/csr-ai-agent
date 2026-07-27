import CSRProfile from "../components/CSRProfile";
import ProfileNavbar from "../components/layout/ProfileNavbar";

function Profile() {
    return (
        <div className="bg-gray-100 min-h-screen">
            <ProfileNavbar />

            <div className="p-6">
                <CSRProfile />
            </div>
        </div>
    );
}

export default Profile;