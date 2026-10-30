declare const centsBrand: unique symbol;
declare const microsBrand: unique symbol;

/** Integer number of cents. Never dollars. */
export type Cents = number & { readonly [centsBrand]: true };

/** Integer millionths of a fraction. 6.125% is 61250. */
export type Micros = number & { readonly [microsBrand]: true };
