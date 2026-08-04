import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useApp } from '../context/AppContext'

const emptyLogin = { email: '', password: '' }
const emptyRegister = {
  fullName: '',
  email: '',
  password: '',
  monthlyBudget: 2000,
}

export default function AuthPage() {
  const { currentUser, login, register, resetDemo } = useApp()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(emptyLogin)
  const [registerForm, setRegisterForm] = useState(emptyRegister)
  const [error, setError] = useState('')

  if (currentUser) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  function redirectByRole(user) {
    navigate(user.role === 'admin' ? '/admin' : '/dashboard')
  }

  function handleLogin(event) {
    event.preventDefault()
    setError('')
    const result = login(loginForm.email, loginForm.password)
    if (!result.ok) {
      setError(result.message)
      return
    }
    redirectByRole(result.user)
  }

  function handleRegister(event) {
    event.preventDefault()
    setError('')
    if (registerForm.password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }
    const result = register(registerForm)
    if (!result.ok) {
      setError(result.message)
      return
    }
    redirectByRole(result.user)
  }

  function demoLogin(role) {
    const credentials =
      role === 'admin'
        ? { email: 'admin@smartwallet.demo', password: 'admin123' }
        : { email: 'user@smartwallet.demo', password: 'demo123' }

    const result = login(credentials.email, credentials.password)
    if (result.ok) redirectByRole(result.user)
  }

  function handleReset() {
    resetDemo()
    setError('Demo data was reset. Choose a demo account to continue.')
  }

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <div className="auth-brand">
          <span className="brand-mark">$</span>
          <strong>SmartWallet</strong>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">CIS 9590 · Group 4 Prototype</p>
          <h1>Spend smarter.<br />Earn more.</h1>
          <p>
            Track monthly spending, manage your wallet, and instantly choose the
            card that earns the strongest reward.
          </p>
        </div>
        <div className="hero-preview">
          <span>Recommended today</span>
          <strong>Amex Gold</strong>
          <small>4% back on dining</small>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="segmented-control">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              Sign in
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              onClick={() => {
                setMode('register')
                setError('')
              }}
            >
              Create account
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-heading">
                <h2>Welcome back</h2>
                <p>Sign in to review your spending and rewards.</p>
              </div>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, email: event.target.value })
                  }
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, password: event.target.value })
                  }
                  placeholder="Enter password"
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button className="primary-button full-width" type="submit">
                Sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-heading">
                <h2>Create your wallet</h2>
                <p>Start with a monthly budget and add your cards later.</p>
              </div>
              <label>
                Full name
                <input
                  required
                  value={registerForm.fullName}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, fullName: event.target.value })
                  }
                  placeholder="Your name"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, email: event.target.value })
                  }
                  placeholder="you@example.com"
                />
              </label>
              <div className="form-grid two">
                <label>
                  Password
                  <input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, password: event.target.value })
                    }
                    placeholder="6+ characters"
                  />
                </label>
                <label>
                  Monthly budget
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={registerForm.monthlyBudget}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        monthlyBudget: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button className="primary-button full-width" type="submit">
                Create account
              </button>
            </form>
          )}

          <div className="demo-divider"><span>Demo access</span></div>
          <div className="demo-actions">
            <button className="secondary-button" onClick={() => demoLogin('user')}>
              Open user demo
            </button>
            <button className="secondary-button" onClick={() => demoLogin('admin')}>
              Open admin demo
            </button>
          </div>
          <button className="reset-button" onClick={handleReset}>
            Reset all demo data
          </button>
        </div>
      </section>
    </div>
  )
}
