<template>
    <div class="theme-wrap">
        <div class="theme-header">{{ theme.theme }}</div>
        <div class="theme-background">
            {{ t('wcsg.backgroundValue', { hex: theme.background }) }}
            <div class="dot" :style="{ backgroundColor: theme.background }"></div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>{{ t('wcsg.color') }}</th>
                    <th>{{ t('wcsg.hex') }}</th>
                    <th>{{ t('wcsg.score') }}</th>
                    <th>{{ t('wcsg.ratio') }}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(result, idx) in theme.results" :key="idx">
                    <td class="data-color">{{ formatColorName(result.Color) }}</td>
                    <td class="data-hex">{{ result.Hex }}</td>
                    <td class="data-score" :class="{ fail: result.Score === 'Fail' }">
                        {{ t(contrastLevelKey(result.Score)) || result.Score }}
                    </td>
                    <td class="data-ratio">{{ result.Ratio }}</td>
                    <td :style="{ backgroundColor: theme.background }">
                        <div class="dot" :style="{ backgroundColor: result.Hex }"></div>
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="score-counts">
            <h3>{{ t('wcsg.scoreCounts') }}</h3>
            <ul>
                <li v-for="(score, index) in sortedScoreCounts(theme.scoreCounts)" :key="index">
                    {{ t(contrastLevelKey(score.label)) }}: <span>{{ score.count }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
const { t } = useI18n();

defineProps({
    theme: {
        type: Object,
        required: true,
    },
});

function sortedScoreCounts(scoreCounts) {
    const order = ['AAA', 'AA', 'AA Large', 'Fail'];

    return order.map((label) => ({
        label,
        count: scoreCounts?.[label] || 0,
    }));
}

function formatColorName(colorName) {
    if (colorName.startsWith('color_')) {
        return t('wcsg.colorNumber', { number: colorName.split('_')[1].replace(/^0/, '') });
    }

    return colorName;
}
</script>

<style lang="scss" scoped>
@use './WcsgThemeCard.scss';
</style>
