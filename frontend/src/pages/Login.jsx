import { useGoogleLogin } from '@react-oauth/google'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const login = useGoogleLogin({
  flow: 'auth-code',
  prompt: 'consent',
  access_type: 'offline',
  scope: [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
    'https://www.googleapis.com/auth/classroom.coursework.me',
  ].join(' '),
    onSuccess: async ({ code }) => {
      try {
        await loginWithGoogle(code)
        navigate('/dashboard')
      } catch (err) {
        console.error('Login failed', err)
      }
    },
    onError: () => console.error('Google Login Failed'),
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-medium">PrioritEase</h1>
      <p className="text-gray-500">Sign in to manage your tasks</p>
      <button
        onClick={login}
        className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow text-gray-700 font-medium"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5"
        />
        Sign in with Google
      </button>
    </div>
  )
}

export default Login