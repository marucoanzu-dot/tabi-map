import { feature } from 'topojson-client';

let _features = null;
let _promise  = null;

export function loadJapanFeatures() {
  if (_features) return Promise.resolve(_features);
  if (_promise)  return _promise;
  _promise = fetch('/japan.topojson')
    .then(r => r.json())
    .then(topo => {
      _features = feature(topo, topo.objects.japan).features;
      return _features;
    });
  return _promise;
}

/** すでにロード済みの場合のみ同期的に返す（未ロードは null） */
export function getCachedFeatures() {
  return _features;
}
