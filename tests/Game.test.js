import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Game from '../src/components/Game.vue';

describe('Game', () => {
  it('renders correctly', () => {
    const wrapper = mount(Game);
    expect(wrapper.exists()).toBe(true);
  });

  it('accepts theme prop', () => {
    const wrapper = mount(Game, {
      props: {
        theme: 'space'
      }
    });
    expect(wrapper.props().theme).toBe('space');
  });
}); 