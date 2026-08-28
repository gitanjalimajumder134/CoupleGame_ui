import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Upload, Image as ImageIcon } from 'lucide-react';
import { signUp, confirmSignUp, signIn, signInWithRedirect, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

import girl1 from './../assets/girl1.jpg';
import girl2 from './../assets/girl2.jpg';
import girl3 from './../assets/girl3.png';
import boy1 from './../assets/boy1.jpg';
import boy2 from './../assets/boy2.jpg';
import boy3 from './../assets/boy3.png';

const CUTE_AVATARS = [girl1, girl2, girl3, boy1, boy2, boy3];

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [authStep, setAuthStep] = useState('MAIN'); // MAIN, VERIFY, PROFILE_COMPLETION
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', age: '',
    sex: 'F', preference: 'M', relationship: 'flirty',
    avatar: CUTE_AVATARS[0]
  });

  // Auto-redirect if valid session exists
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens) {
        // User is logged in via Cognito! We should fetch their attributes or assume they have completed profile.
        // For Google SSO, if they don't have custom attributes in Cognito, we might need a PROFILE_COMPLETION step.
        // For simplicity, if session is valid, just navigate to home.
        const attrs = await fetchUserAttributes();
        
        // Save to local storage for the game to use
        const userData = {
          name: attrs.name || 'User',
          id: attrs.sub, // The Cognito User ID (sub)
          email: attrs.email,
          relationship: attrs['custom:relationship'] || 'flirty',
          gender: attrs['custom:sex'] || 'F',
          avatar: attrs.picture || CUTE_AVATARS[0]
        };
        
        localStorage.setItem('ignite_user', JSON.stringify(userData));
        localStorage.setItem('ignite_token', session.tokens.accessToken.toString());
        
        navigate('/home', { replace: true });
      }
    } catch (err) {
      console.log('No active session.');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, avatar: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const { isSignedIn } = await signIn({
          username: formData.email,
          password: formData.password
        });
        if (isSignedIn) {
          await checkUserSession(); // This sets localStorage and navigates
        }
      } else {
        // --- SIGNUP FLOW ---
        const { isSignUpComplete, nextStep } = await signUp({
          username: formData.email,
          password: formData.password,
          options: {
            userAttributes: {
              email: formData.email,
              name: formData.name,
              'custom:age': formData.age,
              'custom:sex': formData.sex,
              'custom:preference': formData.preference,
              'custom:relationship': formData.relationship,
              picture: formData.avatar
            }
          }
        });
        
        if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          setAuthStep('VERIFY');
        } else if (isSignUpComplete) {
          // Extremely rare to not need verification if it's email based, but just in case
          setAuthStep('MAIN');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username: formData.email,
        confirmationCode: verificationCode
      });
      if (isSignUpComplete) {
        // Automatically sign them in
        await signIn({ username: formData.email, password: formData.password });
        await checkUserSession();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      // Initiates the OAuth flow. Automatically redirects away.
      await signInWithRedirect({ provider: 'Google' });
    } catch (err) {
      console.error('SSO Error:', err);
      setErrorMsg(err.message || 'Failed to connect to Google SSO');
    }
  };

  return (
    <div className="w-full max-w-md backdrop-blur-xl bg-black/50 p-8 rounded-[2rem] border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)] max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="text-center mb-6">
        <Flame className="w-12 h-12 text-red-600 mx-auto mb-2 animate-pulse" />
        <h1 className="text-3xl font-serif text-white font-bold tracking-[0.2em]">IGNITE</h1>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 text-sm rounded-lg text-center">
          {errorMsg}
        </div>
      )}

      {authStep === 'MAIN' && (
        <>
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Avatar Selector (Only for Signup) */}
            {!isLogin && (
              <div className="flex flex-col items-center space-y-3 mb-4">
                <img src={formData.avatar} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-red-500 object-cover shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                
                <div className="flex space-x-2">
                  {CUTE_AVATARS.map((av, idx) => (
                    <img key={idx} src={av} onClick={() => setFormData({ ...formData, avatar: av })} className={`w-10 h-10 rounded-full cursor-pointer transition-all ${formData.avatar === av ? 'border-2 border-red-500 scale-110' : 'opacity-50 hover:opacity-100'}`} alt="Icon" />
                  ))}
                </div>
              </div>
            )}

            {!isLogin && <input type="text" name="name" placeholder="Nickname" required className="w-full py-3 px-4 bg-black/50 border border-red-900/50 rounded-xl text-white focus:border-red-500" value={formData.name} onChange={handleChange} />}
            <input type="email" name="email" placeholder="Email Address" required className="w-full py-3 px-4 bg-black/50 border border-red-900/50 rounded-xl text-white focus:border-red-500" value={formData.email} onChange={handleChange} />
            <input type="password" name="password" placeholder="Password" required className="w-full py-3 px-4 bg-black/50 border border-red-900/50 rounded-xl text-white focus:border-red-500" value={formData.password} onChange={handleChange} />

            {!isLogin && (
              <div className="space-y-4 pt-2 border-t border-red-900/30 mt-4">
                 <div className="flex space-x-3">
                  <input type="number" name="age" placeholder="Age" min="18" required className="w-1/3 py-3 px-4 bg-black/50 border border-red-900/50 rounded-xl text-white focus:border-red-500" value={formData.age} onChange={handleChange} />
                  <select name="sex" className="w-1/3 py-3 px-2 bg-black/50 border border-red-900/50 rounded-xl text-white" value={formData.sex} onChange={handleChange}><option value="M">Male</option><option value="F">Female</option></select>
                  <select name="preference" className="w-1/3 py-3 px-2 bg-black/50 border border-red-900/50 rounded-xl text-white text-sm" value={formData.preference} onChange={handleChange}><option value="F">Pref: F</option><option value="M">Pref: M</option><option value="Both">Both</option></select>
                </div>
                <select name="relationship" className="w-full py-3 px-4 bg-black/50 border border-red-900/50 rounded-xl text-white" value={formData.relationship} onChange={handleChange}>
                  <option value="flirty">Flirty / Talking</option><option value="longterm">Long-Term</option><option value="spouse">Married</option>
                </select>
              </div>
            )}

            <button type="submit" className="w-full py-4 mt-4 bg-red-600 text-white font-black uppercase rounded-xl shadow-lg">
              {isLogin ? 'Enter' : 'Join Now'}
            </button>
          </form>

          <div className="mt-4 border-t border-red-900/30 pt-4 space-y-3">
            <button onClick={() => handleSocialLogin('Google')} className="w-full py-3 bg-white text-black font-bold rounded-xl flex justify-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"/></svg>
              <span>Continue with Google</span>
            </button>
          </div>
          <p className="text-center text-red-300/50 mt-4 text-sm">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-red-500 font-bold">{isLogin ? 'Sign Up Instead' : 'Login Instead'}</button>
          </p>
        </>
      )}

      {authStep === 'VERIFY' && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <p className="text-white/80 text-sm text-center mb-4">We sent a verification code to {formData.email}</p>
          <input type="text" placeholder="Verification Code" required className="w-full py-3 px-4 bg-black/50 border border-red-900/50 rounded-xl text-white focus:border-red-500 text-center tracking-[0.5em] font-mono text-xl" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
          <button type="submit" className="w-full py-4 mt-4 bg-red-600 text-white font-black uppercase rounded-xl shadow-lg">Verify & Enter</button>
          <button type="button" onClick={() => setAuthStep('MAIN')} className="w-full py-2 text-red-400 text-sm font-bold mt-2">Go Back</button>
        </form>
      )}
    </div>
  );
}