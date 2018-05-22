export async function forAwait(iterable, iterator) {
    while (true) {
        const { done, value } = iterable.next();

        if (done) {
            break;
        }

        await iterator(await value);
    }
}
