import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <section className="container section center-text">
    <h1>404</h1>
    <p>The page you are looking for does not exist.</p>
    <Link to="/" className="btn btn-primary">
      Back to Home
    </Link>
  </section>
);

export default NotFoundPage;
