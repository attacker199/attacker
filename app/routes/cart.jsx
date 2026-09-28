import {useLoaderData} from '@remix-run/react';
import {CartForm} from '@shopify/hydrogen';
import {data} from '@shopify/remix-oxygen';
import {CartMain} from '~/components/CartMain';
import {pendoTrack} from '~/lib/pendo.server';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: `Hydrogen | Cart`}];
};

/**
 * @type {HeadersFunction}
 */
export const headers = ({actionHeaders}) => actionHeaders;

/**
 * @param {ActionFunctionArgs}
 */
export async function action({request, context}) {
  const {cart} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result;

  switch (action) {
    case CartForm.ACTIONS.LinesAdd: {
      result = await cart.addLines(inputs.lines);
      // Pendo Track Event: product added to cart
      if (result?.cart) {
        const addedLine = result.cart.lines?.nodes?.find(
          (node) => node.merchandise?.id === inputs.lines?.[0]?.merchandiseId,
        );
        pendoTrack({
          event: 'product_added_to_cart',
          visitorId:
            result.cart.buyerIdentity?.customer?.id ||
            result.cart.id ||
            'anonymous',
          properties: {
            productId: addedLine?.merchandise?.product?.id || '',
            variantId:
              addedLine?.merchandise?.id ||
              inputs.lines?.[0]?.merchandiseId ||
              '',
            variantTitle: addedLine?.merchandise?.title || '',
            quantity: String(inputs.lines?.[0]?.quantity || 1),
            price: addedLine?.merchandise?.price?.amount || '',
            currencyCode: addedLine?.merchandise?.price?.currencyCode || '',
            productTitle: addedLine?.merchandise?.product?.title || '',
            productVendor: addedLine?.merchandise?.product?.vendor || '',
            cartId: result.cart.id || '',
          },
          env: context.env,
          waitUntil: context.waitUntil,
        });
      }
      break;
    }
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      // Pendo Track Event: cart line quantity updated
      if (result?.cart) {
        pendoTrack({
          event: 'cart_line_quantity_updated',
          visitorId:
            result.cart.buyerIdentity?.customer?.id ||
            result.cart.id ||
            'anonymous',
          properties: {
            lineId: String(inputs.lines?.[0]?.id || ''),
            newQuantity: String(inputs.lines?.[0]?.quantity || ''),
            cartId: result.cart.id || '',
          },
          env: context.env,
          waitUntil: context.waitUntil,
        });
      }
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      // Pendo Track Event: cart line removed
      if (result?.cart) {
        pendoTrack({
          event: 'cart_line_removed',
          visitorId:
            result.cart.buyerIdentity?.customer?.id ||
            result.cart.id ||
            'anonymous',
          properties: {
            lineIds: (inputs.lineIds || []).join(', '),
            cartId: result.cart.id || '',
          },
          env: context.env,
          waitUntil: context.waitUntil,
        });
      }
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = formDiscountCode ? [formDiscountCode] : [];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      // Pendo Track Event: discount code applied
      if (result?.cart) {
        pendoTrack({
          event: 'discount_code_applied',
          visitorId:
            result.cart.buyerIdentity?.customer?.id ||
            result.cart.id ||
            'anonymous',
          properties: {
            discountCode: formDiscountCode || '',
            discountCodesCount: String(discountCodes.length),
            cartId: result.cart.id || '',
          },
          env: context.env,
          waitUntil: context.waitUntil,
        });
      }
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesUpdate: {
      const formGiftCardCode = inputs.giftCardCode;

      // User inputted gift card code
      const giftCardCodes = formGiftCardCode ? [formGiftCardCode] : [];

      // Combine gift card codes already applied on cart
      giftCardCodes.push(...inputs.giftCardCodes);

      result = await cart.updateGiftCardCodes(giftCardCodes);
      // Pendo Track Event: gift card applied
      if (result?.cart) {
        pendoTrack({
          event: 'gift_card_applied',
          visitorId:
            result.cart.buyerIdentity?.customer?.id ||
            result.cart.id ||
            'anonymous',
          properties: {
            giftCardCodesCount: String(giftCardCodes.length),
            cartId: result.cart.id || '',
          },
          env: context.env,
          waitUntil: context.waitUntil,
        });
      }
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  const {cart} = context;
  return await cart.get();
}

export default function Cart() {
  /** @type {LoaderReturnData} */
  const cart = useLoaderData();

  return (
    <div className="cart">
      <h1>Cart</h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}

/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/hydrogen').CartQueryDataReturn} CartQueryDataReturn */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').HeadersFunction} HeadersFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof action>} ActionReturnData */
