const {writeFileSync} = require('fs');
const collections = [
    {
        /**
         * Name of the collection for which to generate indexes
         */
        collection: 'example',

        /**
         * Any fields this collection can be filtered.
         * Add the array property if it should be filtered
         * by the 'array-contains' or 'array-contains-any'
         * operators
         */
        queries: [
            {
                fieldPath: 'title'
            },
            {
                fieldPath: 'search',
                array: true
            },
            {
                fieldPath: 'tags',
                array: true
            }
        ],

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

                        if (fieldPath !== query.fieldPath) {
                            indexes.push(
                                {
                                    ...base,
                                    fields: [
                                        {
                                            fieldPath: query.fieldPath,
                                            ...query.array ? {arrayConfig: 'CONTAINS'} : {order: 'ASCENDING'}
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
                                            fieldPath: query.fieldPath,
                                            ...query.array ? {arrayConfig: 'CONTAINS'} : {order: 'DESCENDING'}
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
