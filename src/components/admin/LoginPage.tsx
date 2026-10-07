'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '../../api';

export function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    let mounted = true;
    async function initialize() {
      try {
        await api.check();
        router.replace('/admin/dashboard');
        return;
      } catch {
        try {
          const status = await api.authSetup();
          if (mounted) setSetupRequired(status.setupRequired);
        } catch (cause) {
          if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to check admin setup.');
        } finally {
          if (mounted) setChecked(true);
        }
      }
    }
    void initialize();
    return () => { mounted = false; };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (setupRequired) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        await api.register(name, email, password);
      } else {
        await api.login(email, password);
      }
      router.replace('/admin/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  if (!checked) return <div className="screen-state">Checking sign-in…</div>;
  return (
    <main className="login-screen">
      <section className="login-visual" style={{ backgroundImage: `linear-gradient(180deg, #1217122e, #111711ba), url('${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/images/Project/projectimage.png')` }}><div className="login-brand"><span className="brand-mark">S</span><span>SHILP<small>ADMINISTRATION</small></span></div><div className="login-photo-caption"><span>01 / CONTENT</span><p>Projects, shaped<br />with purpose.</p></div></section>
      <section className="login-panel"><div className="login-form-wrap"><div className="eyebrow"><LockKeyhole size={14} /> SECURE ACCESS</div><h1>{setupRequired ? 'Set up your admin.' : 'Welcome back.'}</h1><p className="muted">{setupRequired ? 'Create the first administrator account to secure the project portfolio.' : 'Sign in to manage the Shilp project portfolio.'}</p>
        <form onSubmit={submit} className="login-form">
          {setupRequired && <label>Administrator name<input type="text" autoComplete="name" maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} /></label>}
          <label>Email address<input type="email" autoComplete={setupRequired ? 'email' : 'username'} maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<span className="password-input"><input type={showPassword ? 'text' : 'password'} autoComplete={setupRequired ? 'new-password' : 'current-password'} minLength={setupRequired ? 12 : undefined} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {setupRequired && <label>Confirm password<input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} maxLength={72} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button login-submit" disabled={busy}>{busy ? (setupRequired ? 'Creating account…' : 'Signing in…') : (setupRequired ? 'Create admin account' : 'Sign in')} {!busy && <ArrowRight size={17} />}</button>
        </form>
        <p className="login-footnote">{setupRequired ? 'This first-time setup is available only until the first admin account is created.' : 'Access is limited to authorized administrators.'}</p>
      </div></section>
    </main>
  );
}