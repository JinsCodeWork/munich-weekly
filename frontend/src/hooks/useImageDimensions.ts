export type { ImageDimension, ImageDimensionsResult, ImageDimensionConfig } from './imageDimensions/types';

export { useSubmissionDimensions } from './imageDimensions/useStoredSubmissionDimensions';
export {
  useImageDimensions,
  useImageDimension,
  createDimensionsGetter,
} from './imageDimensions/useLegacyImageDimensions';
