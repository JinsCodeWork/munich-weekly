export { getFeaturedSubmissions, getGalleryStats } from "./public";
export {
  getActiveConfig,
  getAllConfigs,
  saveConfig,
  deleteConfig,
  previewSubmission,
  checkFeaturedStatus,
  getGalleryConfigs,
  createGalleryConfig,
  updateGalleryConfigByIssueId,
  getGalleryConfigByIssueId,
  deleteGalleryConfigByIssueId,
  updateSubmissionOrderByIssueId,
  getSelectedSubmissions,
  getAvailableIssues,
  uploadCoverImage,
  uploadCoverImageByIssueId,
} from "./admin";
export {
  getPublishedIssues,
  getIssueDetail,
  getIssueSubmissions,
  getGalleryIssueStats,
} from "./issues";
export {
  validateSubmissionIds,
  generateDisplayOrder,
  formatSubmissionIds,
  isWideImage,
} from "./utils";

import * as publicApi from "./public";
import * as adminApi from "./admin";
import * as issueApi from "./issues";
import * as utilsApi from "./utils";

const galleryApi = {
  ...publicApi,
  ...adminApi,
  ...issueApi,
  ...utilsApi,
};

export default galleryApi;