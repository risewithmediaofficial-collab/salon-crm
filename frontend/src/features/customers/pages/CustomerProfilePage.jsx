import React, { useState, useEffect } from 'react';
import useAuthStore from '../../../store/authStore.js';
import useUIStore from '../../../store/uiStore.js';
import customerService from '../customerService.js';
import Card from '../../../components/common/Card.jsx';
import Input from '../../../components/common/Input.jsx';
import Select from '../../../components/common/Select.jsx';
import Button from '../../../components/common/Button.jsx';
import Avatar from '../../../components/common/Avatar.jsx';
import { User, Mail, Phone, Calendar, Heart, Award } from 'lucide-react';

export function CustomerProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const showToast = useUIStore((state) => state.showToast);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState(user?.gender || 'PREFER_NOT_TO_SAY');
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const res = await customerService.getProfile();
        setProfileData(res.data);
        if (res.data?.name) setName(res.data.name);
        if (res.data?.email) setEmail(res.data.email);
        if (res.data?.gender) setGender(res.data.gender);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await customerService.update('profile', {
        name,
        email,
        gender,
      });

      updateUser(res.data);
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile details have been saved successfully.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Unable to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Account & Profile
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Manage your personal details, contact preferences, and loyalty history
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="p-6 text-center flex flex-col items-center">
          <Avatar name={user?.name || user?.phone} size="xl" className="mb-3" />
          <h3 className="text-base font-serif font-bold text-stone-900">{user?.name || 'Customer'}</h3>
          <p className="text-xs text-stone-500 font-mono mt-0.5">+91 {user?.phone}</p>

          <div className="w-full mt-6 pt-6 border-t border-stone-100 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Total Visits
              </span>
              <span className="font-bold text-stone-900">{profileData?.totalVisits || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Member Status
              </span>
              <span className="font-semibold text-salon-800">Privilege Patron</span>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2 p-6">
          <h4 className="text-base font-serif font-bold text-stone-900 mb-4 pb-3 border-b border-stone-100">
            Personal Information
          </h4>

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Full Name"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
            />

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. priya@example.com"
            />

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Mobile Number (Verified)
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 text-xs font-mono">
                <Phone className="w-4 h-4 text-stone-400" />
                <span>+91 {user?.phone}</span>
                <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Verified
                </span>
              </div>
            </div>

            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={[
                { value: 'FEMALE', label: 'Female' },
                { value: 'MALE', label: 'Male' },
                { value: 'OTHER', label: 'Other' },
                { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
              ]}
            />

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default CustomerProfilePage;
