// src/pages/EditProfile.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import styles from './EditProfile.module.css';

type MeResponse = {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    bio?: string;
    website?: string;
    location?: string;
    avatarUrl?: string;
    bannerUrl?: string;
  };
};

export default function EditProfile(): React.JSX.Element | null {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>(undefined);

  const tokenRef = useRef<string | null>(null);

  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl),
    [avatarFile, avatarUrl]
  );
  const bannerPreview = useMemo(
    () => (bannerFile ? URL.createObjectURL(bannerFile) : bannerUrl),
    [bannerFile, bannerUrl]
  );

  // ---------- Cropper states ----------
  const [cropMode, setCropMode] = useState<'avatar' | 'banner' | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  async function createCroppedImage(imageSrc: string, cropPixels: any): Promise<File> {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;

    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Canvas is empty');
        const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg');
    });
  }

  const finishCrop = async () => {
    if (!tempImage || !croppedAreaPixels) return;
    const croppedFile = await createCroppedImage(tempImage, croppedAreaPixels);
    if (cropMode === 'avatar') {
      setAvatarFile(croppedFile);
    } else if (cropMode === 'banner') {
      setBannerFile(croppedFile);
    }
    setCropMode(null);
    setTempImage(null);
  };

  useEffect(() => {
    tokenRef.current = localStorage.getItem('token');
    if (!tokenRef.current) {
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        });
        if (!res.ok) throw new Error('Unauthorized');
        const data: MeResponse = await res.json();
        const u = data.user || (data as any);

        setName(u.name || '');
        setUsername(u.username || '');
        setBio(u.bio || '');
        setWebsite(u.website || '');
        setLocation(u.location || '');
        setAvatarUrl(u.avatarUrl);
        setBannerUrl(u.bannerUrl);
        setLoading(false);
      } catch {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (avatarFile) URL.revokeObjectURL(avatarPreview || '');
      if (bannerFile) URL.revokeObjectURL(bannerPreview || '');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className={styles.loading}>Loading editor…</div>;

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!username.trim()) return 'Username is required';
    if (website && !/^https?:\/\/.+/i.test(website)) return 'Website must start with http(s)://';
    return null;
  };

  const handleSave = async () => {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('username', username.trim());
      fd.append('bio', bio);
      fd.append('website', website);
      fd.append('location', location);
      if (avatarFile) fd.append('avatar', avatarFile);
      if (bannerFile) fd.append('banner', bannerFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        } as any,
        body: fd,
      });

      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || 'Failed to update profile');
      }

      const data = await res.json();
      setAvatarUrl(data?.user?.avatarUrl || avatarUrl);
      setBannerUrl(data?.user?.bannerUrl || bannerUrl);
      setAvatarFile(null);
      setBannerFile(null);
      navigate('/profile', { replace: true });
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const url = URL.createObjectURL(f);
      setTempImage(url);
      setCropMode('avatar');
    }
  };

  const onBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const url = URL.createObjectURL(f);
      setTempImage(url);
      setCropMode('banner');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <h2 className={styles.title}>Edit profile</h2>
        <div className={styles.headerActions}>
          <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className={styles.bannerWrap}>
        {bannerPreview ? (
          <img className={styles.banner} src={bannerPreview} alt="Banner preview" />
        ) : (
          <div className={styles.bannerPlaceholder}>Add a banner</div>
        )}
        <label className={styles.bannerUpload}>
          Change banner
          <input type="file" accept="image/*" onChange={onBannerChange} hidden />
        </label>
      </div>

      <div className={styles.avatarSection}>
        <div className={styles.avatarCircle}>
          {avatarPreview ? (
            <img className={styles.avatarImg} src={avatarPreview} alt="Avatar preview" />
          ) : (
            <div className={styles.avatarPlaceholder}>A</div>
          )}
        </div>
        <label className={styles.avatarUpload}>
          Change avatar
          <input type="file" accept="image/*" onChange={onAvatarChange} hidden />
        </label>
      </div>

      <div className={styles.formCard}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Username</label>
          <input
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Bio</label>
          <textarea
            className={styles.textarea}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the world about you"
            rows={4}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Website</label>
            <input
              className={styles.input}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Location</label>
            <input
              className={styles.input}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>
        </div>

        <div className={styles.footerActions}>
          <button className={styles.secondaryBtn} onClick={handleCancel} disabled={saving}>Cancel</button>
          <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* ---- Cropper Modal ---- */}
      {cropMode && tempImage && (
        <div className={styles.cropperModal}>
          <div className={styles.cropperContainer}>
            <Cropper
              image={tempImage}
              crop={crop}
              zoom={zoom}
              aspect={cropMode === 'avatar' ? 1 : 3}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className={styles.cropperActions}>
            <button onClick={() => { setCropMode(null); setTempImage(null); }}>Cancel</button>
            <button onClick={finishCrop}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
