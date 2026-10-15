import assert from 'node:assert/strict';
import test from 'node:test';

import { podcastListAvailabilityMeta, podcastProcessingMeta } from './podcast.js';

test('podcast list availability never exposes background processing state', () => {
  assert.deepEqual(podcastListAvailabilityMeta(false), {
    label: '仅提供原节目',
    tone: 'idle',
  });
  assert.deepEqual(podcastListAvailabilityMeta(true), {
    label: '精品导读已就绪',
    tone: 'ok',
  });
});

test('readable text without audio uses one neutral label', () => {
  const guide = { blog_ready: true, status: 'failed' };
  for (const status of ['queued', 'synthesizing', 'retry_wait', 'failed', '']) {
    assert.deepEqual(
      podcastListAvailabilityMeta({ premium_guide: { ...guide, status } }),
      { label: '中文导读可阅读', tone: 'idle' },
      status,
    );
  }
  assert.equal(
    podcastListAvailabilityMeta({ condensed_audio_url: '/audio', premium_guide: guide }).label,
    '精品导读音频已就绪',
  );
});

test('no guide text distinguishes generating from a quiet original-only row', () => {
  for (const status of ['queued', 'summarizing', 'synthesizing']) {
    assert.deepEqual(
      podcastListAvailabilityMeta({ premium_guide: { blog_ready: false, status } }),
      { label: '精品导读生成中…', tone: 'run' },
      status,
    );
  }
  for (const status of ['failed', 'retry_wait', '']) {
    assert.deepEqual(
      podcastListAvailabilityMeta({ premium_guide: { status } }),
      { label: '仅提供原节目', tone: 'idle' },
      status,
    );
  }
});

test('reader labels never say failure', () => {
  const samples = [
    podcastProcessingMeta('failed'),
    podcastProcessingMeta('error'),
    podcastProcessingMeta('retry_wait'),
    podcastListAvailabilityMeta({ premium_guide: { blog_ready: true, status: 'failed' } }),
    podcastListAvailabilityMeta({ premium_guide: { status: 'failed' } }),
    podcastListAvailabilityMeta({ premium_guide: { status: 'retry_wait' } }),
  ];
  for (const meta of samples) assert.equal(meta.label.includes('失败'), false);
  assert.deepEqual(podcastProcessingMeta('failed'), { label: '仅提供原节目', tone: 'idle' });
});

test('non-Chinese text-only guide never promises pending audio', () => {
  assert.deepEqual(podcastListAvailabilityMeta({
    premium_guide: { blog_ready: true, status: 'ready', mode: 'brief_zh' },
  }), {
    label: '中文导读已生成', tone: 'ok',
  });
});
