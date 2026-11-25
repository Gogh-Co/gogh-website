<template>
    <!-- Omarchy desktop (Arch + Hyprland): Waybar on top and four tiled
         windows - Neovim with neo-tree, a terminal, btop and Files - all
         recoloured by the theme, the way an Omarchy theme switch does it. -->
    <ScaledStage :width="1100" :height="620">
        <div class="desktop" :style="vars" role="img" :aria-label="`Omarchy desktop mockup in ${themeName}`">
            <div class="waybar">
                <div class="waybar__left">
                    <span class="waybar__logo"></span>
                    <span
                        v-for="workspace in 5"
                        :key="workspace"
                        class="waybar__workspace"
                        :class="{ 'is-active': workspace === 1 }"
                    >{{ workspace }}</span>
                </div>
                <div class="waybar__clock">Friday 12:47</div>
                <div class="waybar__right">
                    <MockIcon name="bluetooth" :size="12" />
                    <MockIcon name="wifi" :size="12" />
                    <MockIcon name="volume" :size="12" />
                    <span class="waybar__cpu">12%</span>
                    <MockIcon name="power" :size="12" class="waybar__power" />
                </div>
            </div>

            <div class="tiles">
                <div class="tiles__col">
                    <!-- Neovim: neo-tree + bash buffer -->
                    <section class="win win--active win--nvim">
                        <div class="nvim">
                            <div class="nvim__tree">
                                <div class="nvim__tree-head">Neo-tree</div>
                                <div v-for="(entry, index) in TREE" :key="index" class="nvim__tree-row" :class="{ 'is-selected': entry.selected }">
                                    <span class="nvim__guide">{{ entry.indent }}</span>
                                    <span :class="entry.dir ? 'nvim__dir' : 'nvim__file'">{{ entry.dir ? '▸ ' : '• ' }}{{ entry.name }}</span>
                                </div>
                            </div>
                            <div class="nvim__editor">
                                <div class="nvim__tabs">
                                    <span class="nvim__tab">neovim.lua</span>
                                    <span class="nvim__tab is-active">omarchy-menu ×</span>
                                </div>
                                <div class="nvim__code">
                                    <div
                                        v-for="(line, index) in codeLines"
                                        :key="index"
                                        class="nvim__line"
                                        :class="{ 'is-current': index === CURRENT_LINE }"
                                    >
                                        <span class="nvim__number">{{ FIRST_LINE + index }}</span>
                                        <span><span v-for="(token, tokenIndex) in line" :key="tokenIndex" :class="`b-${token.type}`">{{ token.text }}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="statusline">
                            <span class="statusline__mode">NORMAL</span>
                            <span class="statusline__branch">dev</span>
                            <span class="statusline__file">bin/omarchy-menu</span>
                            <span class="statusline__spacer"></span>
                            <span class="statusline__muted">bash</span>
                            <span class="statusline__muted">28%</span>
                            <span class="statusline__pos">{{ FIRST_LINE + CURRENT_LINE }}:8</span>
                        </div>
                    </section>

                    <!-- Terminal: eza-style long listing -->
                    <section class="win win--term">
                        <div class="term__line"><span class="p-dir">omarchy</span> <span class="p-branch">dev</span> <span class="p-char">❯</span> ls</div>
                        <div class="term__line term__head">{{ LISTING_HEADER }}</div>
                        <div v-for="row in listingRows" :key="row.key" class="term__line"><span
                            v-for="(segment, segmentIndex) in row.segments"
                            :key="segmentIndex"
                            :class="segment.cls"
                        >{{ segment.text }}</span></div>
                        <div class="term__line"><span class="p-dir">omarchy</span> <span class="p-branch">dev</span> <span class="p-char">❯</span> <span class="term__cursor"></span></div>
                    </section>
                </div>

                <div class="tiles__col">
                    <!-- btop -->
                    <section class="win win--btop">
                        <div class="box box--cpu">
                            <span class="box__title">¹cpu <em>menu</em> <em>preset *</em></span>
                            <span class="box__title box__title--right">12:47:09 · 2000ms</span>
                            <div class="cpu">
                                <div class="cpu__graph">
                                    <span v-for="(value, index) in CPU_GRAPH" :key="index" :class="loadClass(value)" :style="{ height: `${value}%` }"></span>
                                </div>
                                <div class="cpu__cores">
                                    <div class="cpu__total">CPU <span class="meter"><span :class="loadClass(12)" style="width: 12%"></span></span> 12% <b>41°C</b></div>
                                    <div v-for="core in CORES" :key="core.name" class="cpu__core">
                                        <span>{{ core.name }}</span>
                                        <span class="meter meter--small"><span :class="loadClass(core.value)" :style="{ width: `${core.value}%` }"></span></span>
                                        <span class="cpu__pct">{{ core.value }}%</span>
                                    </div>
                                    <div class="cpu__load">Load avg: 0.81 0.94 0.86</div>
                                </div>
                            </div>
                        </div>

                        <div class="btop__bottom">
                            <div class="btop__left">
                                <div class="box box--mem">
                                    <span class="box__title">²mem <em>disks</em></span>
                                    <div v-for="row in MEMORY" :key="row.label" class="mem__row">
                                        <span>{{ row.label }}</span>
                                        <span class="meter"><span :class="row.cls" :style="{ width: `${row.value}%` }"></span></span>
                                        <span class="mem__value">{{ row.text }}</span>
                                    </div>
                                </div>
                                <div class="box box--net">
                                    <span class="box__title">³net <em>enp191s0</em></span>
                                    <div class="net">
                                        <div class="net__graph">
                                            <span v-for="(value, index) in NET_GRAPH" :key="index" :style="{ height: `${value}%` }"></span>
                                        </div>
                                        <div class="net__stats">
                                            <span><b class="net__down">▼</b> 3.77 KiB/s</span>
                                            <span><b class="net__up">▲</b> 2.82 KiB/s</span>
                                            <span class="net__muted">Total 81.1 GiB</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="box box--proc">
                                <span class="box__title">⁴proc <em>filter</em> <em>tree</em></span>
                                <div class="proc__row proc__head">
                                    <span>Pid</span><span>Program</span><span>User</span><span>MemB</span><span>Cpu%</span>
                                </div>
                                <div v-for="(process, index) in PROCESSES" :key="process.pid" class="proc__row" :class="{ 'is-selected': index === 2 }">
                                    <span>{{ process.pid }}</span><span>{{ process.name }}</span><span>user</span><span>{{ process.mem }}</span><span>{{ process.cpu }}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Files -->
                    <section class="win win--files">
                        <div class="files__bar">
                            <span class="files__title"><MockIcon name="search" :size="12" /> Files <MockIcon name="menu" :size="12" /></span>
                            <span class="files__nav"><MockIcon name="chevron-left" :size="14" /><MockIcon name="chevron-right" :size="14" class="files__muted" /></span>
                            <span class="files__path"><MockIcon name="home" :size="12" /> Home</span>
                        </div>
                        <div class="files__body">
                            <ul class="files__sidebar">
                                <li v-for="place in PLACES" :key="place.label" :class="{ 'is-active': place.active }">
                                    <MockIcon :name="place.icon" :size="12" /> {{ place.label }}
                                </li>
                            </ul>
                            <div class="files__grid">
                                <div v-for="folder in FOLDERS" :key="folder.name" class="files__item" :class="{ 'is-selected': folder.selected }">
                                    <span class="folder"><MockIcon v-if="folder.icon" :name="folder.icon" :size="16" class="folder__glyph" /></span>
                                    <span class="files__label">{{ folder.name }}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </ScaledStage>
</template>

<script setup>
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
        '--wall-a': mixColors(t.background, t.color_05, 0.35),
        '--wall-b': mixColors(t.background, t.color_06, 0.3),
        '--bar': mixColors(t.background, t.foreground, 0.04),
        '--selection': mixColors(t.background, t.color_05, 0.28),
        '--folder-back': mixColors(t.color_05, '#000000', 0.3),
        '--folder-glyph': mixColors(t.color_05, t.background, 0.55),
        '--mode-ink': inkOnFill(t.color_05, t.background),
        '--pos-ink': inkOnFill(t.color_03, t.background),
    };
});

const TREE = [
    { name: 'bin', dir: true, indent: '' },
    { name: 'omarchy-hyprland-monitor-scaling', indent: '│ ' },
    { name: 'omarchy-hyprland-window-gaps', indent: '│ ' },
    { name: 'omarchy-install-dev-env', indent: '│ ' },
    { name: 'omarchy-install-docker-dbs', indent: '│ ' },
    { name: 'omarchy-launch-browser', indent: '│ ' },
    { name: 'omarchy-launch-editor', indent: '│ ' },
    { name: 'omarchy-launch-webapp', indent: '│ ' },
    { name: 'omarchy-lock-screen', indent: '│ ' },
    { name: 'omarchy-menu', indent: '│ ', selected: true },
    { name: 'omarchy-menu-keybindings', indent: '│ ' },
    { name: 'omarchy-migrate', indent: '│ ' },
    { name: 'omarchy-notification-dismiss', indent: '│ ' },
    { name: 'omarchy-theme-next', indent: '│ ' },
    { name: 'omarchy-theme-set', indent: '│ ' },
    { name: 'config', dir: true, indent: '' },
    { name: 'default', dir: true, indent: '' },
    { name: 'themes', dir: true, indent: '' },
    { name: 'install.sh', indent: '' },
];

const FIRST_LINE = 119;
const CURRENT_LINE = 2;

const SOURCE = `show_webcam_select_menu() {
  local devices=$(get_webcam_list)
  local count=$(echo "$devices" | grep -c . 2>/dev/null || echo 0)

  if [[ -z $devices ]] || ((count == 0)); then
    notify-send "No webcam devices found" -u critical -t 3000
    return 1
  fi

  if ((count == 1)); then
    echo "$devices" | awk '{print $1}'
  else
    menu "Select Webcam" "$devices" | awk '{print $1}'
  fi
}

# Stop a running recording, or ask what to capture.
show_screenrecord_menu() {
  omarchy-cmd-screenrecord --stop-recording && exit 0

  case $(menu "Screenrecord" "With no audio\\nWith desktop audio") in
  *"With no audio"*) omarchy-cmd-screenrecord ;;
  *"With desktop audio"*) omarchy-cmd-screenrecord --with-desktop-audio ;;
  esac
}`;

const BASH_KEYWORDS = new Set(['if', 'then', 'else', 'elif', 'fi', 'for', 'in', 'do', 'done', 'case', 'esac', 'while', 'local', 'return', 'exit']);
const BASH_COMMANDS = new Set(['echo', 'awk', 'grep', 'menu', 'notify-send', 'omarchy-cmd-screenrecord', 'get_webcam_list']);
const BASH_PATTERN = /(#.*$)|("(?:[^"\\]|\\.)*"|'[^']*')|(\$\(|\$\w+)|(\s--?[a-z][\w-]*)|(\b\d+\b)|([A-Za-z_][\w-]*)(?=\(\))|([A-Za-z_][\w-]*)|(\s+)|(.)/g;

function tokenizeBash(line) {
    const tokens = [];
    for (const match of line.matchAll(BASH_PATTERN)) {
        const [text, comment, string, variable, option, number, definition, word] = match;
        let type = 'plain';
        if (comment) type = 'comment';
        else if (string) type = 'string';
        else if (variable) type = 'variable';
        else if (option) type = 'option';
        else if (number) type = 'number';
        else if (definition) type = 'function';
        else if (word) type = BASH_KEYWORDS.has(word) ? 'keyword' : BASH_COMMANDS.has(word) ? 'function' : 'plain';

        const previous = tokens[tokens.length - 1];
        if (previous && previous.type === type) previous.text += text;
        else tokens.push({ type, text });
    }
    return tokens.length ? tokens : [{ type: 'plain', text: ' ' }];
}

const codeLines = SOURCE.split('\n').map(tokenizeBash);

const LISTING = [
    { perms: 'drwxr-xr-x', size: '-', date: '26 Feb 19:23', name: 'applications', dir: true },
    { perms: 'drwxr-xr-x', size: '-', date: '26 Mar 16:36', name: 'bin', dir: true },
    { perms: 'drwxr-xr-x', size: '-', date: '26 Feb 19:23', name: 'config', dir: true },
    { perms: 'drwxr-xr-x', size: '-', date: ' 8 Mar 11:12', name: 'default', dir: true },
    { perms: 'drwxr-xr-x', size: '-', date: '26 Mar 16:36', name: 'themes', dir: true },
    { perms: '.rw-r--r--', size: '2.6k', date: '26 Mar 16:36', name: 'AGENTS.md' },
    { perms: '.rwxr-xr-x', size: '2.9k', date: '26 Feb 19:23', name: 'boot.sh', exec: true },
    { perms: '.rw-r--r--', size: '1.6k', date: ' 5 Jan 13:07', name: 'icon.png' },
    { perms: '.rwxr-xr-x', size: '580', date: '21 Feb 10:10', name: 'install.sh', exec: true },
    { perms: '.rw-r--r--', size: '1.1k', date: ' 5 Jan 13:07', name: 'LICENSE' },
    { perms: '.rw-r--r--', size: '1.5k', date: ' 5 Jan 13:07', name: 'README.md' },
];

// eza's defaults: d blue, r yellow, w red, x green; sizes green, user
// yellow, dates blue. Columns are padded to the header's widths.
const LISTING_HEADER = 'Permissions Size User Date Modified Name';

function permClass(bit) {
    return { d: 'l-dir', r: 'l-read', w: 'l-write', x: 'l-exec' }[bit] || 'l-none';
}

const listingRows = LISTING.map((row) => ({
    key: row.name,
    segments: [
        ...[...row.perms].map((bit) => ({ text: bit, cls: permClass(bit) })),
        { text: `  ${row.size.padStart(4, ' ')}`, cls: 'l-size' },
        { text: ' user ', cls: 'l-user' },
        { text: row.date.padEnd(13, ' '), cls: 'l-date' },
        { text: ` ${row.name}`, cls: row.dir ? 'l-dir' : row.exec ? 'l-exec' : '' },
    ],
}));

// btop's default gradient: green, then yellow, then red as load grows.
function loadClass(value) {
    if (value >= 70) return 'load--high';
    if (value >= 35) return 'load--mid';
    return 'load--low';
}

const CPU_GRAPH = [8, 12, 10, 18, 22, 15, 9, 7, 14, 26, 38, 30, 18, 12, 9, 11, 16, 24, 48, 72, 55, 34, 20, 14, 10, 8, 12, 19, 28, 22, 16, 12, 9, 7, 10, 14, 18, 12, 9, 15, 30, 44, 36, 22, 14, 10, 8, 9, 12, 16, 20, 14, 10, 8, 11, 13];
const CORES = [
    { name: 'C0', value: 18 }, { name: 'C1', value: 6 }, { name: 'C2', value: 42 },
    { name: 'C3', value: 12 }, { name: 'C4', value: 78 }, { name: 'C5', value: 9 },
];
const MEMORY = [
    { label: 'Used', value: 52, text: '32.1 GiB', cls: 'mem--used' },
    { label: 'Avail', value: 48, text: '30.0 GiB', cls: 'mem--avail' },
    { label: 'Cached', value: 61, text: '37.7 GiB', cls: 'mem--cached' },
    { label: 'root', value: 64, text: '596 GiB', cls: 'mem--disk' },
    { label: 'home', value: 41, text: '929 GiB', cls: 'mem--disk' },
];
const NET_GRAPH = [10, 30, 15, 60, 25, 80, 35, 20, 45, 70, 30, 15, 55, 90, 40, 20, 35, 65, 25, 15, 50, 30];
const PROCESSES = [
    { pid: 1432, name: 'Hyprland', mem: '232M', cpu: '4.1' },
    { pid: 7886, name: 'chromium', mem: '1.1G', cpu: '2.3' },
    { pid: 2391, name: 'nvim', mem: '105M', cpu: '0.6' },
    { pid: 2210, name: 'alacritty', mem: '84M', cpu: '0.4' },
    { pid: 4880, name: 'spotify', mem: '597M', cpu: '0.3' },
    { pid: 6117, name: 'nautilus', mem: '638M', cpu: '0.2' },
    { pid: 1599, name: 'waybar', mem: '76M', cpu: '0.1' },
    { pid: 1603, name: 'mako', mem: '22M', cpu: '0.0' },
    { pid: 1611, name: 'pipewire', mem: '31M', cpu: '0.0' },
    { pid: 3120, name: 'btop', mem: '18M', cpu: '0.0' },
];

const PLACES = [
    { label: 'Home', icon: 'home', active: true },
    { label: 'Recent', icon: 'clock' },
    { label: 'Starred', icon: 'star' },
    { label: 'Network', icon: 'network' },
    { label: 'Trash', icon: 'trash' },
    { label: 'Downloads', icon: 'download' },
];

const FOLDERS = [
    { name: 'Desktop' },
    { name: 'Documents', icon: 'menu' },
    { name: 'Downloads', icon: 'download' },
    { name: 'Dropbox' },
    { name: 'Music', icon: 'music' },
    { name: 'Pictures', icon: 'image' },
    { name: 'Public', icon: 'network' },
    { name: 'Videos', icon: 'camera', selected: true },
];
</script>

<style lang="scss" scoped>
.desktop {
    display: grid;
    grid-template-rows: 20px 1fr;
    gap: 6px;
    width: 100%;
    height: 100%;
    padding: 4px 8px 8px;
    background: linear-gradient(135deg, var(--wall-a), var(--bg) 55%, var(--wall-b));
    color: var(--fg);
    font-family: 'Roboto Mono', 'DejaVu Sans Mono', 'Ubuntu Mono', monospace;
    font-size: 10px;
    line-height: 1.5;
    text-align: left;
}

.waybar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0 8px;
    background: var(--bar);
    font-size: 10px;
}

.waybar__left,
.waybar__right {
    display: flex;
    align-items: center;
    gap: 9px;
}

.waybar__right {
    justify-content: flex-end;
}

.waybar__logo {
    width: 9px;
    height: 9px;
    border: 2px solid var(--fg);
}

.waybar__workspace {
    color: var(--c09);
}

.waybar__workspace.is-active {
    color: var(--c05);
    font-weight: 700;
}

.waybar__clock {
    font-weight: 700;
}

.waybar__cpu {
    color: var(--c03);
}

.waybar__power {
    color: var(--c02);
}

.tiles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    min-height: 0;
}

.tiles__col {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 0;
}

.win {
    overflow: hidden;
    min-height: 0;
    border: 2px solid var(--line);
    background: var(--bg);
}

.win--active {
    border-color: var(--c05);
}

/* Neovim */
.win--nvim {
    display: flex;
    flex: 1.55;
    flex-direction: column;
}

.nvim {
    display: grid;
    flex: 1;
    grid-template-columns: 36% 1fr;
    min-height: 0;
}

.nvim__tree {
    overflow: hidden;
    padding: 2px 0;
    border-right: 1px solid var(--line);
    background: var(--surface);
    white-space: nowrap;
}

.nvim__tree-head {
    padding: 0 6px 2px;
    color: var(--c05);
    font-weight: 700;
}

.nvim__tree-row {
    padding: 0 6px;
    line-height: 1.45;

    &.is-selected {
        background: var(--selection);
    }
}

.nvim__guide {
    color: var(--c09);
    white-space: pre;
}

.nvim__dir {
    color: var(--c05);
    font-weight: 700;
}

.nvim__editor {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.nvim__tabs {
    display: flex;
    background: var(--surface);
    white-space: nowrap;
}

.nvim__tab {
    padding: 1px 10px;
    color: var(--c09);

    &.is-active {
        background: var(--bg);
        color: var(--fg);
        font-weight: 700;
        box-shadow: inset 0 2px 0 var(--c05);
    }
}

.nvim__code {
    overflow: hidden;
    padding: 2px 0;
}

.nvim__line {
    display: flex;
    line-height: 1.45;
    white-space: pre;

    &.is-current {
        background: var(--surface);

        .nvim__number {
            color: var(--c04);
            font-weight: 700;
        }
    }
}

.nvim__number {
    flex: 0 0 4ch;
    margin-right: 1.5ch;
    color: var(--c09);
    text-align: right;
}

.b-comment { color: var(--c09); font-style: italic; }
.b-keyword { color: var(--c06); font-weight: 700; }
.b-string { color: var(--c03); }
.b-variable { color: var(--c07); }
.b-option,
.b-number { color: var(--c04); }
.b-function { color: var(--c05); }

.statusline {
    display: flex;
    background: var(--surface-2);
    white-space: nowrap;

    span {
        padding: 0 8px;
    }
}

.statusline__mode {
    background: var(--c05);
    color: var(--mode-ink);
    font-weight: 700;
}

.statusline__branch {
    color: var(--c06);
}

.statusline__spacer {
    flex: 1;
}

.statusline__muted {
    color: var(--c09);
}

.statusline__pos {
    background: var(--c03);
    color: var(--pos-ink);
    font-weight: 700;
}

/* Terminal */
.win--term {
    flex: 1;
    padding: 6px 8px;
}

.term__line {
    line-height: 1.45;
    white-space: pre;
}

.term__head {
    text-decoration: underline;
}

.p-dir { color: var(--c07); font-weight: 700; }
.p-branch { color: var(--c06); font-weight: 700; }
.p-char { color: var(--c03); font-weight: 700; }

.l-dir { color: var(--c05); font-weight: 700; }
.l-read { color: var(--c04); }
.l-write { color: var(--c02); }
.l-exec { color: var(--c03); font-weight: 700; }
.l-none { color: var(--c09); }
.l-size { color: var(--c03); }
.l-user { color: var(--c04); }
.l-date { color: var(--c05); }

.term__cursor {
    display: inline-block;
    width: 0.6em;
    height: 1.1em;
    vertical-align: text-bottom;
    background: var(--cursor);
}

/* btop */
.win--btop {
    display: flex;
    flex: 1.35;
    flex-direction: column;
    gap: 4px;
    padding: 6px;
}

.box {
    position: relative;
    min-height: 0;
    padding: 10px 6px 4px;
    border: 1px solid var(--box, var(--line));
}

.box__title {
    position: absolute;
    top: -7px;
    left: 8px;
    padding: 0 4px;
    background: var(--bg);
    color: var(--fg);
    font-weight: 700;
    line-height: 1.2;

    em {
        color: var(--c09);
        font-style: normal;
        font-weight: 400;
    }
}

.box__title--right {
    right: 8px;
    left: auto;
    color: var(--c09);
    font-weight: 400;
}

.box--cpu { --box: var(--c03); }
.box--mem { --box: var(--c04); }
.box--net { --box: var(--c06); }
.box--proc { --box: var(--c02); }

.load--low { background: var(--c03); }
.load--mid { background: var(--c04); }
.load--high { background: var(--c02); }

.cpu {
    display: grid;
    grid-template-columns: 1fr 46%;
    gap: 8px;
}

.cpu__graph {
    display: flex;
    align-items: flex-end;
    gap: 1px;
    height: 92px;
    border-bottom: 1px solid var(--line);

    span {
        flex: 1;
        min-height: 1px;
    }
}

.cpu__cores {
    padding: 2px 4px;
    border: 1px solid var(--line);
}

.cpu__total {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--c05);
    font-weight: 700;

    b {
        margin-left: auto;
        color: var(--c03);
        font-weight: 400;
    }
}

.cpu__core {
    display: grid;
    grid-template-columns: 3ch 1fr 4ch;
    align-items: center;
    gap: 6px;
    color: var(--c09);
}

.cpu__pct {
    color: var(--fg);
    text-align: right;
}

.cpu__load {
    color: var(--c09);
    text-align: right;
}

.meter {
    position: relative;
    display: inline-block;
    flex: 1;
    height: 5px;
    background: var(--surface-2);

    span {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
    }
}

.meter--small {
    height: 4px;
}

.btop__bottom {
    display: grid;
    flex: 1;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 6px;
    min-height: 0;
    padding-top: 6px;
}

.btop__left {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
}

.mem__row {
    display: grid;
    grid-template-columns: 6ch 1fr 8ch;
    align-items: center;
    gap: 6px;
    color: var(--c09);
}

.mem__value {
    color: var(--fg);
    text-align: right;
}

.mem--used { background: var(--c02); }
.mem--avail { background: var(--c03); }
.mem--cached { background: var(--c05); }
.mem--disk { background: var(--c06); }

.box--net {
    flex: 1;
}

.net {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    height: 100%;
}

.net__graph {
    display: flex;
    align-items: flex-end;
    gap: 1px;
    height: 34px;

    span {
        flex: 1;
        background: var(--c06);
    }
}

.net__stats {
    display: flex;
    flex-direction: column;
    line-height: 1.35;
}

.net__down { color: var(--c06); }
.net__up { color: var(--c05); }
.net__muted { color: var(--c09); }

.box--proc {
    overflow: hidden;
}

.proc__row {
    display: grid;
    grid-template-columns: 5ch 1fr 5ch 5ch 4ch;
    gap: 6px;
    line-height: 1.4;

    span:nth-child(n + 3) {
        text-align: right;
    }

    &.is-selected {
        background: var(--selection);
        font-weight: 700;
    }
}

.proc__head {
    color: var(--c05);
    font-weight: 700;
}

/* Files */
.win--files {
    display: flex;
    flex: 1;
    flex-direction: column;
    font-family: Roboto, Arial, sans-serif;
    font-size: 10px;
}

.files__bar {
    display: grid;
    grid-template-columns: 130px auto 1fr;
    align-items: center;
    gap: 10px;
    padding: 5px 8px;
    border-bottom: 1px solid var(--line);
}

.files__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 700;
}

.files__nav {
    display: flex;
    gap: 4px;
}

.files__muted {
    color: var(--c09);
}

.files__path {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    border-radius: 5px;
    background: var(--surface-2);
    font-weight: 700;
}

.files__body {
    display: grid;
    flex: 1;
    grid-template-columns: 146px 1fr;
    min-height: 0;
}

.files__sidebar {
    margin: 0;
    padding: 6px;
    background: var(--surface);
    list-style: none;

    li {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 3px 6px;
        border-radius: 5px;
    }

    li.is-active {
        background: var(--surface-2);
        font-weight: 700;
    }
}

.files__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-content: center;
    gap: 6px;
    padding: 6px 10px;
}

.files__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px 2px;
    border: 1px solid transparent;
    border-radius: 6px;

    &.is-selected {
        border-color: var(--c05);
        background: var(--selection);
    }
}

.folder {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 34px;
    margin-top: 5px;
    border-radius: 4px;
    background: var(--c05);
    box-shadow: inset 0 3px 0 var(--folder-back);

    &::before {
        position: absolute;
        top: -5px;
        left: 0;
        width: 20px;
        height: 7px;
        border-radius: 3px 3px 0 0;
        background: var(--folder-back);
        content: '';
    }
}

.folder__glyph {
    color: var(--folder-glyph);
}
</style>
