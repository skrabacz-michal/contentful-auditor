import { Flex, Note, Paragraph, TextLink } from '@contentful/f36-components';

const LocalhostWarning = () => (
  <Flex marginTop="spacingXl" justifyContent="center">
    <Note title="App running outside of Contentful" style={{ maxWidth: '800px' }}>
      <Paragraph>
        Contentful Apps need to run inside the Contentful web app to function properly. Install the
        app into a space and render your app into one of the{' '}
        <TextLink href="https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#locations">
          available locations
        </TextLink>
        .
      </Paragraph>
    </Note>
  </Flex>
);

export default LocalhostWarning;
