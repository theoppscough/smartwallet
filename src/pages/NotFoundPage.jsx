import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <span className="brand-mark">$</span>
      <h1>Page not found</h1>
      <p>The page you requested does not exist in this prototype.</p>
      <Link className="primary-button" to="/">Return home</Link>
    </main>
  )
}
