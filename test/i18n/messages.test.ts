import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/i18n/config';
import { isPluralMessage, lookup, messageKeys, type MessageTree } from '@/i18n/translate';
import en from '@/i18n/messages/en';
import es from '@/i18n/messages/es';
import zh from '@/i18n/messages/zh';
import ar from '@/i18n/messages/ar';
import pt from '@/i18n/messages/pt';
import id from '@/i18n/messages/id';
import fr from '@/i18n/messages/fr';
import ja from '@/i18n/messages/ja';
import ru from '@/i18n/messages/ru';
import de from '@/i18n/messages/de';

const TRANSLATIONS: Record<string, MessageTree> = { es, zh, ar, pt, id, fr, ja, ru, de };
const EN_KEYS = messageKeys(en).sort();

// {colorLower} is {color} in lower case: a language picks whichever reads right.
const ALIASES: Record<string, string> = { colorLower: 'color' };

function placeholders(text: string): string[] {
    return [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((match) => ALIASES[match[1]!] ?? match[1]!))].sort();
}

describe('locale list', () => {
    it('has a message file for every language but English', () => {
        expect(LOCALES).toHaveLength(10);
        expect(LOCALES[0]!.code).toBe('en');
        expect(Object.keys(TRANSLATIONS).sort()).toEqual(LOCALES.slice(1).map((locale) => locale.code).sort());
    });
});

describe.each(Object.entries(TRANSLATIONS))('%s messages', (code, messages) => {
    it('has exactly the English keys', () => {
        expect(messageKeys(messages).sort()).toEqual(EN_KEYS);
    });

    it('uses the same placeholders as English', () => {
        for (const key of EN_KEYS) {
            const source = lookup(en, key)!;
            const target = lookup(messages, key)!;
            if (isPluralMessage(source)) {
                expect(isPluralMessage(target), key).toBe(true);
                const allowed = placeholders(String(source.other));
                expect(placeholders(String((target as MessageTree).other)), `${key}.other`).toEqual(allowed);
                // Other forms may spell the number out ("one theme"), never add a placeholder.
                for (const [form, text] of Object.entries(target as MessageTree)) {
                    for (const name of placeholders(String(text))) {
                        expect(allowed, `${key}.${form}`).toContain(name);
                    }
                }
            } else {
                expect(typeof target, key).toBe('string');
                expect(placeholders(target as string), `${code}: ${key}`).toEqual(placeholders(source as string));
            }
        }
    });

    it('keeps the manifesto accents', () => {
        expect(String(lookup(messages, 'manifesto.copy'))).toMatch(/\[[^\]]+\]/);
    });
});
