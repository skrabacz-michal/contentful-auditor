import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { expect } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';

configure({ testIdAttribute: 'data-test-id' });
expect.extend(matchers);
