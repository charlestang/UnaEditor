import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue';

export function useFullscreen(container: Ref<HTMLElement | undefined>) {
  const isFullscreen = ref(false);
  const fullscreenMode = ref<'browser' | 'screen' | null>(null);

  // Toggle fullscreen
  const toggleFullscreen = async (mode: 'browser' | 'screen' = 'browser') => {
    if (!container.value) return;

    if (mode === 'browser') {
      // Browser fullscreen: CSS fixed positioning to fill viewport
      if (fullscreenMode.value !== 'browser') {
        container.value.classList.add('una-editor-fullscreen-browser');
        isFullscreen.value = true;
        fullscreenMode.value = 'browser';
      } else {
        container.value.classList.remove('una-editor-fullscreen-browser');
        isFullscreen.value = false;
        fullscreenMode.value = null;
      }
    } else if (mode === 'screen') {
      // Screen fullscreen: Fullscreen API to fill entire screen
      if (!document.fullscreenElement) {
        try {
          await container.value.requestFullscreen();
          isFullscreen.value = true;
          fullscreenMode.value = 'screen';
        } catch (err) {
          console.error('Failed to enter fullscreen:', err);
        }
      } else {
        await document.exitFullscreen();
        isFullscreen.value = false;
        fullscreenMode.value = null;
      }
    }
  };

  // Exit fullscreen
  const exitFullscreen = async () => {
    if (!container.value) return;

    if (fullscreenMode.value === 'browser') {
      container.value.classList.remove('una-editor-fullscreen-browser');
    } else if (fullscreenMode.value === 'screen' && document.fullscreenElement) {
      await document.exitFullscreen();
    }

    isFullscreen.value = false;
    fullscreenMode.value = null;
  };

  // Listen to fullscreenchange event
  const handleFullscreenChange = () => {
    if (!document.fullscreenElement && fullscreenMode.value === 'screen') {
      isFullscreen.value = false;
      fullscreenMode.value = null;
    }
  };

  onMounted(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });

  return {
    isFullscreen,
    fullscreenMode,
    toggleFullscreen,
    exitFullscreen,
  };
}
