/* Sahna DOM havolalari — bir joyda */
const $ = (id) => document.getElementById(id);

export const stage = $('stage');
export const journey = $('journey');
export const canvas = $('scene');
export const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
export const labelsEl = $('labels');
export const heroCopy = $('heroCopy');
export const summitCopy = $('summitCopy');
export const scrollHint = $('scrollHint');
export const caption = stage.querySelector('.stage__caption');
export const shade = stage.querySelector('.stage__shade');
export const routeEl = $('route');

export const card = {
  root: $('stageCard'),
  step: $('cardStep'),
  bars: [...document.querySelectorAll('#cardProgress i')],
  body: $('cardBody'),
  title: $('cardTitle'),
  desc: $('cardDesc'),
  list: $('cardList'),
  peers: $('cardPeers')
};
