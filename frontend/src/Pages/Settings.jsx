import { useState, useEffect } from "react";
import { authAPI, settingsAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";

function Settings() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    theme: "light",
    notifications: { email: true, sms: true, inApp: true },
    privacy: { profileVisibility: "RestrictedToOffice", showPhone: false, showEmail: true },
    language: "en",
    twoFactorAuth: false,
    sessionManagement: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setSettings((prev) => ({ ...prev, theme }));
  }, [theme]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsAPI.getSettings();
        if (response.data.data) {
          const merged = {
            ...settings,
            ...response.data.data,
            theme: "light",
          };
          setSettings(merged);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const inputClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

  const handleThemeChange = (nextTheme) => {
    const safeTheme = nextTheme === "dark" ? "dark" : "light";
    setSettings((prev) => ({ ...prev, theme: safeTheme }));
    setTheme(safeTheme);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveMessage("");
    setSaveError("");
    setSaving(true);
    try {
      await settingsAPI.updateSettings(settings);
      setSaveMessage("Settings saved successfully.");
    } catch {
      setSaveError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Please fill current password, new password and confirm password.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordMessage(response.data?.message || "Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowChangePassword(false);
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <p className="text-sm text-slate-500">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Manage your preferences and account settings</p>

      <form onSubmit={handleSaveSettings} className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 font-semibold dark:text-slate-100">Appearance</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <select className={inputClass} value={settings.theme} onChange={(e) => handleThemeChange(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <select className={inputClass} value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 font-semibold dark:text-slate-100">Notifications</h3>
          <div className="space-y-2 text-sm dark:text-slate-200">
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.notifications.email} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, email: e.target.checked } })} /> Email Notifications</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.notifications.sms} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, sms: e.target.checked } })} /> SMS Notifications</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.notifications.inApp} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, inApp: e.target.checked } })} /> In-App Notifications</label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 font-semibold dark:text-slate-100">Privacy</h3>
          <div className="space-y-3 text-sm dark:text-slate-200">
            <select className={inputClass} value={settings.privacy.profileVisibility} onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, profileVisibility: e.target.value } })}>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
              <option value="RestrictedToOffice">Restricted to Office</option>
            </select>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.privacy.showPhone} onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, showPhone: e.target.checked } })} /> Show Phone Number</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.privacy.showEmail} onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, showEmail: e.target.checked } })} /> Show Email</label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-3 font-semibold dark:text-slate-100">Security</h3>
          <div className="space-y-3 text-sm dark:text-slate-200">
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.twoFactorAuth} onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })} /> Enable Two-Factor Authentication</label>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              onClick={() => {
                setShowChangePassword((prev) => !prev);
                setPasswordError("");
                setPasswordMessage("");
              }}
            >
              {showChangePassword ? "Close Password Form" : "Change Password"}
            </button>

            {showChangePassword && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="mb-3 text-xs text-slate-600 dark:text-slate-300">
                  To change password: enter your current password, then set and confirm your new password.
                  After saving, login will work only with the new password.
                </p>
                <form onSubmit={handleChangePassword} className="grid gap-3 md:grid-cols-3">
                  <input
                    className={inputClass}
                    type="password"
                    placeholder="Current Password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                  <input
                    className={inputClass}
                    type="password"
                    placeholder="New Password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                  <input
                    className={inputClass}
                    type="password"
                    placeholder="Confirm New Password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                  <div className="md:col-span-3">
                    <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" disabled={passwordSaving}>
                      {passwordSaving ? "Changing Password..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.sessionManagement} onChange={(e) => setSettings({ ...settings, sessionManagement: e.target.checked })} /> Enable Session/Device Management</label>
          </div>
        </section>

        {passwordMessage && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{passwordMessage}</p>}
        {passwordError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{passwordError}</p>}
        {saveMessage && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{saveMessage}</p>}
        {saveError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{saveError}</p>}

        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </main>
  );
}

export default Settings;
