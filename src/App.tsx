import { locations } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import Page from './locations/Page';
import ConfigScreen from './locations/ConfigScreen';

const App = () => {
  const sdk = useSDK();
  if (sdk.location.is(locations.LOCATION_PAGE)) return <Page />;
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) return <ConfigScreen />;
  return null;
};

export default App;
