import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UnaEditor from '../src/components/UnaEditor.vue'

describe('UnaEditor', () => {
  it('renders properly', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'test content',
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('accepts v-model binding', async () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: 'initial content',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      },
    })
    expect(wrapper.props('modelValue')).toBe('initial content')
  })

  it('respects lineNumbers prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        lineNumbers: false,
      },
    })
    expect(wrapper.props('lineNumbers')).toBe(false)
  })

  it('respects locale prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        locale: 'en-US',
      },
    })
    expect(wrapper.props('locale')).toBe('en-US')
  })

  it('respects theme prop', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
        theme: 'dark',
      },
    })
    expect(wrapper.props('theme')).toBe('dark')
  })

  it('exposes focus and getSelection methods', () => {
    const wrapper = mount(UnaEditor, {
      props: {
        modelValue: '',
      },
    })
    expect(wrapper.vm.focus).toBeDefined()
    expect(wrapper.vm.getSelection).toBeDefined()
    expect(wrapper.vm.toggleFullscreen).toBeDefined()
    expect(wrapper.vm.exitFullscreen).toBeDefined()
  })
})
