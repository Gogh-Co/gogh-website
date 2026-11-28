import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export const HISTORY_MOTION_KEY = 'gogh-history-motion';

export function useHistoryMotion() {
    const calm = ref(false);
    const systemReduced = ref(false);
    const ready = ref(false);
    let preference: MediaQueryList | null = null;
    const enabled = computed(() => ready.value && !calm.value && !systemReduced.value);

    function setCalm(value: boolean) {
        calm.value = value;
        try { localStorage.setItem(HISTORY_MOTION_KEY, value ? 'calm' : 'full'); } catch { /* In-memory preference still works. */ }
    }
    const onSystem = () => { systemReduced.value = !!preference?.matches; };
    const onStorage = (event: StorageEvent) => {
        if (event.key === HISTORY_MOTION_KEY) calm.value = event.newValue === 'calm';
    };

    onMounted(() => {
        try { calm.value = localStorage.getItem(HISTORY_MOTION_KEY) === 'calm'; } catch { /* Storage can be unavailable. */ }
        preference = matchMedia('(prefers-reduced-motion: reduce)');
        onSystem();
        preference.addEventListener('change', onSystem);
        window.addEventListener('storage', onStorage);
        ready.value = true;
    });
    onBeforeUnmount(() => {
        preference?.removeEventListener('change', onSystem);
        window.removeEventListener('storage', onStorage);
    });
    return { calm, systemReduced, ready, enabled, setCalm };
}
