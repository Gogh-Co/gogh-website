<template>
    <!-- A Quickshell-style desktop (QtQuick shells such as Caelestia or
         end-4's dots-hyprland): floating rounded bar, app launcher,
         notifications, an OSD and a dashboard, all from the theme. -->
    <ScaledStage :width="1100" :height="620">
        <div class="qs" :style="vars" role="img" :aria-label="t('previews.quickshell.aria', { name: themeName })">
            <div class="qs__bar">
                <div class="qs__bar-group">
                    <span class="qs__launcher-btn"><MockIcon name="apps" :size="13" /></span>
                    <span class="qs__workspaces">
                        <span v-for="workspace in 6" :key="workspace" class="qs__ws" :class="{ 'is-active': workspace === 2, 'is-busy': [1, 3, 5].includes(workspace) }"></span>
                    </span>
                    <span class="qs__window-title">kitty — ~/dotfiles</span>
                </div>
                <div class="qs__bar-group qs__bar-group--center">
                    <span class="qs__pill qs__pill--media"><MockIcon name="music" :size="12" /> Midnight City</span>
                    <span class="qs__pill qs__pill--clock">12:47 · Fri 27 Nov</span>
                </div>
                <div class="qs__bar-group qs__bar-group--right">
                    <MockIcon name="wifi" :size="13" />
                    <MockIcon name="bluetooth" :size="13" />
                    <MockIcon name="volume" :size="13" />
                    <span class="qs__battery"><span class="qs__battery-fill"></span><b>87%</b></span>
                    <span class="qs__power"><MockIcon name="power" :size="13" /></span>
                </div>
            </div>

            <!-- Notifications, top-left -->
            <div class="qs__notifications">
                <div class="qs__toast">
                    <span class="qs__toast-icon qs__toast-icon--ok"><MockIcon name="camera" :size="16" /></span>
                    <span class="qs__toast-text">
                        <b>Screenshot saved</b>
                        <span>~/Pictures/2026-11-27_12-46.png</span>
                    </span>
                    <span class="qs__toast-time">now</span>
                </div>
                <div class="qs__toast">
                    <span class="qs__toast-icon qs__toast-icon--warn"><MockIcon name="battery" :size="16" /></span>
                    <span class="qs__toast-text">
                        <b>Updates available</b>
                        <span>14 packages can be upgraded</span>
                    </span>
                    <span class="qs__toast-time">5m</span>
                </div>
            </div>

            <!-- Launcher, centre -->
            <div class="qs__launcher">
                <div class="qs__search">
                    <MockIcon name="search" :size="16" />
                    <span>fi<span class="qs__caret"></span></span>
                </div>
                <div v-for="(app, index) in APPS" :key="app.name" class="qs__app" :class="{ 'is-selected': index === 0 }">
                    <span class="qs__app-icon" :class="`qs__app-icon--${app.tone}`"><MockIcon :name="app.icon" :size="16" /></span>
                    <span class="qs__app-text">
                        <b>{{ app.name }}</b>
                        <span>{{ app.description }}</span>
                    </span>
                </div>
            </div>

            <!-- Volume OSD, bottom centre -->
            <div class="qs__osd">
                <MockIcon name="volume" :size="15" />
                <span class="qs__osd-track"><span style="width: 62%"></span></span>
                <b>62</b>
            </div>

            <!-- Dashboard, right -->
            <aside class="qs__dash">
                <div class="qs__user">
                    <span class="qs__avatar"></span>
                    <span class="qs__user-text">
                        <b>user</b>
                        <span>up 3h 12m · archlinux</span>
                    </span>
                    <span class="qs__round-btn"><MockIcon name="sliders" :size="14" /></span>
                    <span class="qs__round-btn qs__round-btn--power"><MockIcon name="power" :size="14" /></span>
                </div>

                <div class="qs__toggles">
                    <span v-for="toggle in TOGGLES" :key="toggle.label" class="qs__toggle" :class="{ 'is-on': toggle.on }">
                        <MockIcon :name="toggle.icon" :size="15" />
                        <span class="qs__toggle-text">
                            <b>{{ toggle.label }}</b>
                            <span>{{ toggle.state }}</span>
                        </span>
                    </span>
                </div>

                <div class="qs__slider">
                    <MockIcon name="volume" :size="14" />
                    <span class="qs__track"><span class="qs__track-fill" style="width: 62%"></span></span>
                </div>
                <div class="qs__slider qs__slider--bright">
                    <MockIcon name="sun" :size="14" />
                    <span class="qs__track"><span class="qs__track-fill" style="width: 80%"></span></span>
                </div>

                <div class="qs__media">
                    <span class="qs__art"><MockIcon name="music" :size="22" /></span>
                    <span class="qs__media-text">
                        <b>Midnight City</b>
                        <span>M83 · Hurry Up, We're Dreaming</span>
                        <span class="qs__progress"><span style="width: 38%"></span></span>
                    </span>
                    <span class="qs__media-controls">
                        <MockIcon name="prev" :size="14" />
                        <span class="qs__play"><MockIcon name="pause" :size="14" /></span>
                        <MockIcon name="next" :size="14" />
                    </span>
                </div>

                <div class="qs__calendar">
                    <div class="qs__calendar-head"><b>November 2026</b><span>‹ ›</span></div>
                    <div class="qs__calendar-grid">
                        <span v-for="day in WEEKDAYS" :key="day" class="qs__weekday">{{ day }}</span>
                        <span v-for="(day, index) in calendarDays" :key="index" class="qs__day" :class="{ 'is-today': day === 27, 'is-muted': !day }">{{ day || '' }}</span>
                    </div>
                </div>
            </aside>
        </div>
    </ScaledStage>
</template>

<script setup>
const { t } = useI18n();
import ScaledStage from './mock/ScaledStage.vue';
import MockIcon from './mock/MockIcon.vue';

const props = defineProps({
    theme: {
        type: Object,
        required: true,
    },
});

const themeName = computed(() => (props.theme?.name || props.theme?.theme || 'Theme').toString());

const vars = computed(() => {
    const t = props.theme;
    return {
        ...themeCssVars(t),
        // Wallpaper: the background with soft blooms of the accents.
        '--bloom-a': mixColors(t.background, t.color_05, 0.55),
        '--bloom-b': mixColors(t.background, t.color_06, 0.5),
        '--bloom-c': mixColors(t.background, t.color_03, 0.35),
        '--panel': mixColors(t.background, t.foreground, 0.05),
        '--panel-2': mixColors(t.background, t.foreground, 0.11),
        '--accent-soft': mixColors(t.background, t.color_05, 0.25),
        '--accent-ink': inkOnFill(t.color_05, t.background),
        '--power-ink': inkOnFill(t.color_02, t.background),
    };
});

const APPS = [
    { name: 'Firefox', description: 'Browse the web', icon: 'globe', tone: 'red' },
    { name: 'Files', description: 'Access and organize files', icon: 'folder', tone: 'blue' },
    { name: 'Fish shell', description: 'Terminal with fish', icon: 'terminal', tone: 'green' },
    { name: 'Fingerprint settings', description: 'Enroll a finger', icon: 'sliders', tone: 'yellow' },
];

const TOGGLES = [
    { label: 'Wi-Fi', state: 'home-5G', icon: 'wifi', on: true },
    { label: 'Bluetooth', state: 'Headphones', icon: 'bluetooth', on: true },
    { label: 'Do not disturb', state: 'Off', icon: 'bell', on: false },
    { label: 'Night light', state: 'Sunset', icon: 'moon', on: false },
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
// November 2026 starts on a Sunday: six empty cells, then 1-30.
const calendarDays = [...Array(6).fill(0), ...Array.from({ length: 30 }, (_, index) => index + 1)];
</script>

<style lang="scss" scoped>
.qs {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background:
        radial-gradient(circle at 18% 78%, var(--bloom-a), transparent 42%),
        radial-gradient(circle at 62% 18%, var(--bloom-b), transparent 38%),
        radial-gradient(circle at 88% 92%, var(--bloom-c), transparent 35%),
        var(--bg);
    color: var(--fg);
    font-family: Roboto, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.35;
    text-align: left;

    b {
        font-weight: 700;
    }
}

.qs__bar {
    position: absolute;
    top: 10px;
    right: 12px;
    left: 12px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    height: 38px;
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--panel);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.qs__bar-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.qs__bar-group--center {
    gap: 8px;
}

.qs__bar-group--right {
    justify-content: flex-end;
}

.qs__launcher-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 9px;
    background: var(--c05);
    color: var(--accent-ink);
}

.qs__workspaces {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 8px;
    border-radius: 10px;
    background: var(--panel-2);
}

.qs__ws {
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background: var(--line);

    &.is-busy {
        background: var(--c09);
    }

    &.is-active {
        width: 22px;
        background: var(--c05);
    }
}

.qs__window-title {
    color: var(--c09);
}

.qs__pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 10px;
    background: var(--panel-2);
}

.qs__pill--media {
    color: var(--c06);
}

.qs__pill--clock {
    font-weight: 700;
}

.qs__battery {
    position: relative;
    display: flex;
    align-items: center;
    width: 50px;
    height: 18px;
    overflow: hidden;
    border-radius: 6px;
    background: var(--panel-2);

    b {
        position: relative;
        width: 100%;
        font-size: 10px;
        text-align: center;
    }
}

.qs__battery-fill {
    position: absolute;
    inset: 0 auto 0 0;
    width: 87%;
    background: var(--c03);
    opacity: 0.45;
}

.qs__power {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 9px;
    background: var(--c02);
    color: var(--power-ink);
}

/* Notifications */
.qs__notifications {
    position: absolute;
    top: 62px;
    left: 12px;
    display: grid;
    gap: 8px;
    width: 290px;
}

.qs__toast {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--panel);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
}

.qs__toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--panel-2);
}

.qs__toast-icon--ok { color: var(--c03); }
.qs__toast-icon--warn { color: var(--c04); }

.qs__toast-text {
    display: flex;
    flex-direction: column;
    min-width: 0;

    span {
        overflow: hidden;
        color: var(--c09);
        white-space: nowrap;
        text-overflow: ellipsis;
    }
}

.qs__toast-time {
    align-self: start;
    color: var(--c09);
    font-size: 10px;
}

/* Launcher */
.qs__launcher {
    position: absolute;
    top: 150px;
    left: 340px;
    display: grid;
    gap: 4px;
    width: 360px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--panel);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.qs__search {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 6px;
    padding: 9px 12px;
    border-radius: 12px;
    background: var(--panel-2);
    color: var(--c09);
    font-size: 14px;

    > span {
        color: var(--fg);
    }
}

.qs__caret {
    display: inline-block;
    width: 2px;
    height: 15px;
    margin-left: 1px;
    vertical-align: text-bottom;
    background: var(--c05);
}

.qs__app {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 7px 10px;
    border-radius: 12px;

    &.is-selected {
        background: var(--accent-soft);
    }
}

.qs__app-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--panel-2);
}

.qs__app-icon--red { color: var(--c02); }
.qs__app-icon--blue { color: var(--c05); }
.qs__app-icon--green { color: var(--c03); }
.qs__app-icon--yellow { color: var(--c04); }

.qs__app-text {
    display: flex;
    flex-direction: column;

    span {
        color: var(--c09);
        font-size: 11px;
    }
}

/* OSD */
.qs__osd {
    position: absolute;
    bottom: 18px;
    left: 380px;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 280px;
    padding: 9px 14px;
    border: 1px solid var(--line);
    border-radius: 16px;
    background: var(--panel);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

.qs__osd-track {
    flex: 1;
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--panel-2);

    span {
        display: block;
        height: 100%;
        background: var(--c05);
    }
}

/* Dashboard */
.qs__dash {
    position: absolute;
    top: 62px;
    right: 12px;
    bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 330px;
    padding: 14px;
    border: 1px solid var(--line);
    border-radius: 20px;
    background: var(--panel);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.qs__user {
    display: flex;
    align-items: center;
    gap: 10px;
}

.qs__avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--c05), var(--c06));
}

.qs__user-text {
    display: flex;
    flex: 1;
    flex-direction: column;

    span {
        color: var(--c09);
        font-size: 11px;
    }
}

.qs__round-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--panel-2);
}

.qs__round-btn--power {
    background: var(--c02);
    color: var(--power-ink);
}

.qs__toggles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.qs__toggle {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: 14px;
    background: var(--panel-2);

    &.is-on {
        background: var(--c05);
        color: var(--accent-ink);

        .qs__toggle-text span {
            color: inherit;
            opacity: 0.8;
        }
    }
}

.qs__toggle-text {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b {
        white-space: nowrap;
    }

    span {
        color: var(--c09);
        font-size: 10px;
    }
}

.qs__slider {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 4px;
}

.qs__track {
    position: relative;
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: var(--panel-2);
}

.qs__track-fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 4px;
    background: var(--c05);

    &::after {
        position: absolute;
        top: 50%;
        right: -7px;
        width: 14px;
        height: 14px;
        border: 3px solid var(--c05);
        border-radius: 50%;
        background: var(--panel);
        content: '';
        transform: translateY(-50%);
    }
}

.qs__slider--bright .qs__track-fill {
    background: var(--c04);

    &::after {
        border-color: var(--c04);
    }
}

.qs__media {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 12px;
    padding: 10px;
    border-radius: 14px;
    background: var(--panel-2);
}

.qs__art {
    display: flex;
    grid-row: span 2;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--c06), var(--c02));
    color: var(--bg);
}

.qs__media-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    > span:not(.qs__progress) {
        overflow: hidden;
        color: var(--c09);
        font-size: 11px;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
}

.qs__progress {
    height: 4px;
    margin-top: 4px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--line);

    span {
        display: block;
        height: 100%;
        background: var(--c03);
    }
}

.qs__media-controls {
    display: flex;
    align-items: center;
    gap: 14px;
}

.qs__play {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--c05);
    color: var(--accent-ink);
}

.qs__calendar {
    flex: 1;
    padding: 10px;
    border-radius: 14px;
    background: var(--panel-2);
}

.qs__calendar-head {
    display: flex;
    justify-content: space-between;
    margin: 0 0 6px;

    span {
        color: var(--c09);
    }
}

.qs__calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    font-size: 10.5px;
    text-align: center;
}

.qs__weekday {
    color: var(--c09);
    font-weight: 700;
}

.qs__day {
    padding: 2px 0;
    border-radius: 8px;

    &.is-today {
        background: var(--c05);
        color: var(--accent-ink);
        font-weight: 700;
    }
}
</style>
