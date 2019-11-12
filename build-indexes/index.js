const {writeFileSync} = require('fs');
const collections = [
    {
        /**
         * Name of the collection for which to generate indexes
         */
        collection: 'example',

        /**
         * Any fields this collection can be filtered by using the '==', '>', '<', '>=' or '<=' operators
         */
        queries: ['search', 'category', 'active'],

        /**
         * Any fields this collection can be filtered by using the 'array-contains' and 'array-contains-any' operators
         */
        array: ['search', 'category'],

        /**
         * Any fields this collection can be ordered by
         */
        order: ['createdOn', 'name', 'price', 'active', 'quantity', 'order']
    }
];

writeFileSync(
    'firestore.indexes.json',
    JSON.stringify(
        collections.reduce((acc, cur) => {

            const base = {
                collectionGroup: cur.collection,
                queryScope: 'COLLECTION'
            };

            cur.queries.forEach(query => {

                acc.indexes.push(
                    ...cur.order.reduce((indexes, fieldPath) => {

                        if (fieldPath !== query) {
                            indexes.push(
                                {
                                    ...base,
                                    fields: [
                                        {
                                            fieldPath: query,
                                            ...cur.array && cur.array.includes(query) ? {arrayConfig: 'CONTAINS'} : {order: 'ASCENDING'}
                                        },
                                        {
                                            fieldPath,
                                            order: 'DESCENDING'
                                        }
                                    ]
                                },
                                {
                                    ...base,
                                    fields: [
                                        {
                                            fieldPath: query,
                                            ...cur.array && cur.array.includes(query) ? {arrayConfig: 'CONTAINS'} : {order: 'DESCENDING'}
                                        },
                                        {
                                            fieldPath,
                                            order: 'ASCENDING'
                                        }
                                    ]
                                }
                            );
                        }

                        return indexes;
                    }, [])
                )

            });


            return acc;
        }, {
            indexes: [],
            fieldOverrides: []
        }),
        null,
        2
    )
);
