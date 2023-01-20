import Processor from './Processor.js'

function createEdgeCallback (context, callback) {
  if (!callback) {
    return () => {}
  }

  return edge => callback(context.extend(edge))
}

class Path {
  constructor ({ dataset, edges = [], factory, graph, term }) {
    if (!dataset && edges.length === 0) {
      throw new Error('dataset or edges is required')
    }

    if (edges.length === 0 && typeof term === 'undefined') {
      throw new Error('edges or term must be given')
    }

    if (edges.length > 0 && term) {
      throw new Error('edges or term must be given')
    }

    this.dataset = dataset || edges[edges.length - 1].dataset
    this.edges = edges
    this.factory = factory
    this._term = term
    this._graph = graph
  }

  get edge () {
    return this.edges[this.edges.length - 1]
  }

  get graph () {
    if (typeof this._graph === 'object') {
      return this._graph
    }

    return this.edge && this.edge.graph
  }

  get length () {
    if (this._term !== undefined) {
      return 1
    }

    return this.edges.length + 1
  }

  get startTerm () {
    return this._term || this.edges[0].startTerm
  }

  get term () {
    if (this._term !== undefined) {
      return this._term
    }

    return this.edge.term
  }

  get value () {
    const term = this.term

    return term === null ? undefined : term.value
  }

  addIn (predicates, subjects, callback) {
    return Processor.add({
      ptr: this,
      start: 'object',
      end: 'subject',
      subjects,
      predicates,
      graphs: [this.graph || this.factory.defaultGraph()],
      callback: createEdgeCallback(this, callback)
    })
  }

  addList (predicates, items) {
    return Processor.addList({
      ptr: this,
      predicates,
      graphs: [this.graph || this.factory.defaultGraph()],
      items
    })
  }

  addOut (predicates, objects, callback) {
    return Processor.add({
      ptr: this,
      start: 'subject',
      end: 'object',
      predicates,
      objects,
      graphs: [this.graph || this.factory.defaultGraph()],
      callback: createEdgeCallback(this, callback)
    })
  }

  deleteIn (predicates, subjects) {
    return Processor.delete({
      ptr: this,
      start: 'object',
      subjects,
      predicates
    })
  }

  deleteList (predicates) {
    return Processor.deleteList({
      ptr: this,
      predicates
    })
  }

  deleteOut (predicates, objects) {
    return Processor.delete({
      ptr: this,
      start: 'subject',
      predicates,
      objects
    })
  }

  execute ({ operation, quantifier, start, end, subjects, predicates, objects, graphs, items, callback }) {
    return Processor.execute({
      ptr: this,
      operation,
      quantifier,
      start,
      end,
      subjects,
      predicates,
      objects,
      graphs,
      items,
      callback
    })
  }

  extend (edge) {
    return new this.constructor({
      dataset: this.dataset,
      edges: [...this.edges, edge],
      factory: this.factory,
      graph: this._graph
    })
  }

  hasIn (predicates, subjects) {
    return Processor.traverse({
      ptr: this,
      start: 'object',
      end: 'object',
      subjects,
      predicates,
      graphs: [this.graph]
    })
  }

  hasOut (predicates, objects) {
    return Processor.traverse({
      ptr: this,
      start: 'subject',
      end: 'subject',
      predicates,
      objects,
      graphs: [this.graph]
    })
  }

  in (predicates, subjects) {
    return Processor.traverse({
      ptr: this,
      start: 'object',
      end: 'subject',
      subjects,
      predicates,
      graphs: [this.graph]
    })
  }

  isAny () {
    return !this.term
  }

  isList () {
    return Processor.isList({ ptr: this })
  }

  list () {
    return Processor.list({ ptr: this })
  }

  nodes () {
    const path = this

    const at = index => {
      if (this._term !== undefined) {
        return {
          dataset: this.dataset,
          term: this._term
        }
      }

      if (this.edges.length > index) {
        return {
          dataset: this.edges[index].dataset,
          term: this.edges[index].startTerm
        }
      }

      if (this.edges.length === index) {
        return {
          dataset: this.edges[index - 1].dataset,
          term: this.edges[index - 1].term
        }
      }
    }

    return {
      * [Symbol.iterator] () {
        for (let index = 0; index < path.length; index++) {
          yield at(index)
        }
      }
    }
  }

  out (predicates, objects) {
    return Processor.traverse({
      ptr: this,
      predicates,
      objects,
      graphs: [this.graph]
    })
  }

  quads () {
    const path = this

    return {
      * [Symbol.iterator] () {
        for (const edge of path.edges) {
          yield edge.quad
        }
      }
    }
  }

  trim () {
    return new this.constructor({
      dataset: this.dataset,
      factory: this.factory,
      graph: this.graph,
      term: this.term
    })
  }
}

export default Path
