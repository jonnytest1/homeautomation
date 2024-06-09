import { environment } from '../environments/environment';

export function getBackendBaseUrl() {
  return environment.prefixPath || document.baseURI
}