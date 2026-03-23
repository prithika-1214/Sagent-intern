import { Link } from 'react-router-dom';

const StatCard = ({ title, value, color = 'default', to }) => {
  const className = `stat-card ${color}${to ? ' stat-card-link' : ''}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        <p>{title}</p>
        <h3>{value}</h3>
      </Link>
    );
  }

  return (
    <article className={className}>
      <p>{title}</p>
      <h3>{value}</h3>
    </article>
  );
};

export default StatCard;
