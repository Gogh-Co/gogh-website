<template>
    <!-- Flat at rest; on hover of its button (`.random-dice-host`) it turns
         into a small 3D die that tumbles (front face = the flat icon's five),
         faster while the host has `.is-loading`. -->
    <span class="random-dice" aria-hidden="true">
        <svg class="random-dice__flat" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m2.5 3a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3M12 10.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3M7.5 15a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3m9 0a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3"/></svg>
        <span class="random-dice__stage">
            <span class="random-dice__cube">
                <span v-for="face in 6" :key="face" class="random-dice__face" :class="`random-dice__face--${face}`"></span>
            </span>
        </span>
    </span>
</template>

<!-- Not scoped: the hover/loading state comes from the host button. -->
<style lang="scss">
@use 'sass:list';
@use '@/assets/sass/base' as *;

$dice_size: 14px;
$dice_pip: 1.15px;

// One radial-gradient layer per pip, positions in % of the face.
@function dice-pips($positions...) {
    $layers: ();
    @each $x, $y in $positions {
        $layers: list.append($layers, radial-gradient(circle at $x $y, currentColor 0 $dice_pip, transparent $dice_pip + 0.4px), comma);
    }
    @return $layers;
}

.random-dice {
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
}

.random-dice__flat {
    display: block;
    transition: opacity 0.2s ease, transform 0.35s $ease_out_expo;
}

// Perspective + fade live on this wrapper: opacity on the cube itself would
// flatten its preserve-3d faces.
.random-dice__stage {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    opacity: 0;
    perspective: 90px;
    pointer-events: none;
    transition: opacity 0.2s ease;
}

.random-dice__cube {
    position: relative;
    width: $dice_size;
    height: $dice_size;
    transform-style: preserve-3d;
}

.random-dice__face {
    position: absolute;
    inset: 0;
    border: 1.25px solid currentColor;
    border-radius: 3px;
    background-color: #0a0f14;
    backface-visibility: hidden;

    // Opposite faces add up to 7; the front one is the flat icon's five so
    // the swap from flat to 3D is seamless.
    &--5 {
        background-image: dice-pips(25% 25%, 75% 25%, 50% 50%, 25% 75%, 75% 75%);
        transform: translateZ($dice_size * 0.5);
    }

    &--2 {
        background-image: dice-pips(25% 25%, 75% 75%);
        transform: rotateY(180deg) translateZ($dice_size * 0.5);
    }

    &--3 {
        background-image: dice-pips(25% 25%, 50% 50%, 75% 75%);
        transform: rotateY(90deg) translateZ($dice_size * 0.5);
    }

    &--4 {
        background-image: dice-pips(25% 25%, 75% 25%, 25% 75%, 75% 75%);
        transform: rotateY(-90deg) translateZ($dice_size * 0.5);
    }

    &--1 {
        background-image: dice-pips(50% 50%);
        transform: rotateX(90deg) translateZ($dice_size * 0.5);
    }

    &--6 {
        background-image: dice-pips(25% 25%, 75% 25%, 25% 50%, 75% 50%, 25% 75%, 75% 75%);
        transform: rotateX(-90deg) translateZ($dice_size * 0.5);
    }
}

// Desktop with a real pointer only: 3D on hover.
@media (min-width: 992px) and (hover: hover) and (pointer: fine) {
    .random-dice-host:hover,
    .random-dice-host.is-loading {
        .random-dice__flat {
            opacity: 0;
            transform: scale(0.7);
        }

        .random-dice__stage {
            opacity: 1;
        }

        .random-dice__cube {
            animation: random-dice-tumble 2.6s linear infinite;
        }
    }

    .random-dice-host.is-loading .random-dice__cube {
        animation-duration: 0.7s;
    }
}

// Starts square-on (the five facing you) so it picks up right where the
// flat icon left off, then rolls over two axes.
@keyframes random-dice-tumble {
    from {
        transform: rotateX(0deg) rotateY(0deg);
    }

    to {
        transform: rotateX(360deg) rotateY(720deg);
    }
}

// Small screens and touch: the flat icon spins while the theme list loads.
@media (max-width: 991.98px), (hover: none), (pointer: coarse) {
    .random-dice-host.is-loading .random-dice__flat {
        animation: random-dice-roll 0.6s $ease_out_expo infinite;
    }
}

@keyframes random-dice-roll {
    to {
        transform: rotate(360deg);
    }
}

// No tumbling: hovering just shows the die at rest, tilted to read as 3D.
@media (prefers-reduced-motion: reduce) {
    .random-dice-host .random-dice__cube {
        animation: none !important;
        transform: rotateX(-24deg) rotateY(32deg);
    }
}
</style>
