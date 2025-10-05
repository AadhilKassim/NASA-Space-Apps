import '../src/index.css';
import 'leaflet/dist/leaflet.css';
import { AsteroidProvider } from '../src/contexts/asteroidcontext';

export default function App({ Component, pageProps }) {
  return (
    <AsteroidProvider>
      <Component {...pageProps} />
    </AsteroidProvider>
  );
}
