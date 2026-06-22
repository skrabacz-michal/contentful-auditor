import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  Box,
  Form,
  FormControl,
  Heading,
  Note,
  TextInput,
} from '@contentful/f36-components';
import { useEffect, useState } from 'react';

type InstallParams = {
  managementToken?: string;
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [managementToken, setManagementToken] = useState('');

  useEffect(() => {
    sdk.app.getParameters<InstallParams>().then((params) => {
      if (params?.managementToken) setManagementToken(params.managementToken);
      sdk.app.setReady();
    });
  }, [sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => ({
      parameters: { managementToken },
    }));
  }, [sdk, managementToken]);

  return (
    <Box margin="spacingXl" style={{ maxWidth: 600 }}>
      <Heading marginBottom="spacingL">Contentful Auditor</Heading>
      <Form>
        <FormControl>
          <FormControl.Label>Management API Token</FormControl.Label>
          <TextInput
            value={managementToken}
            type="password"
            placeholder="CFPAT-…"
            onChange={(e) => setManagementToken(e.target.value)}
          />
          <FormControl.HelpText>
            A Personal Access Token from <strong>Settings → API keys → Personal Access Tokens</strong>.
            Used only to list environments in the Migrations tab. Leave blank to use text inputs instead.
          </FormControl.HelpText>
        </FormControl>
        <Note variant="warning">
          Store only tokens scoped to this space. Anyone with access to this app configuration can read this value.
        </Note>
      </Form>
    </Box>
  );
};

export default ConfigScreen;
