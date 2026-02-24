class QueryGrammar {

    static relationalOperators = new Set(['>', '<', '=', '!=', '<=', '>=', '<>', 'IS', 'IS NOT']);

    static clauses = {
        distinct: 'DISTINCT',
        offSet: 'OFFSET',
        limit: 'LIMIT',
        from: 'FROM',
        where: 'WHERE',
        groupBy: 'GROUP BY',
        orderBy: 'ORDER BY',
        join: 'JOIN',
        having: 'HAVING',
        between: 'BETWEEN',
        with: 'WITH',
        returning: 'RETURNING',
        exists: 'EXISTS',
        using: 'USING',
        when: 'WHEN',
        end: 'END',
        then: 'THEN',
        case: 'CASE',
        else: 'ELSE',
        set: 'SET'
    }

    static actions = {
        select: 'SELECT',
        insert: 'INSERT',
        delete: 'DELETE',
        update: 'UPDATE'
    }

    static joinTypes = {
        innerJoin: 'INNER JOIN',
        leftJoin: 'LEFT JOIN',
        rightJoin: 'RIGHT JOIN',
        fullOuterJoin: 'FULL OUTER JOIN',
        crossJoin: 'CROSS JOIN',
    };

    static logicalOperator = {
        or: 'OR',
        and: 'AND',
    };

    static orderByTypes = {
        asc: 'ASC',
        desc: 'DESC'
    };

    static extra = {
        in: 'IN',
        notIn: 'NOT IN',
        as: 'AS'
    }
}

module.exports = { QueryGrammar };