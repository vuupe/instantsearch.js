/* eslint-env mocha */

import React from 'react';
import expect from 'expect';
import sinon from 'sinon';


import expectJSX from 'expect-jsx';
expect.extend(expectJSX);

import defaultTemplates from '../defaultTemplates.js';
import defaultLabels from '../defaultLabels.js';
import starRating from '../star-rating.js';
import RefinementList from '../../../components/RefinementList/RefinementList.js';

describe('starRating()', () => {
  let ReactDOM;
  let container;
  let widget;
  let helper;
  let state;
  let createURL;

  let autoHideContainer;
  let headerFooter;
  let results;

  beforeEach(() => {
    ReactDOM = {render: sinon.spy()};
    starRating.__Rewire__('ReactDOM', ReactDOM);
    autoHideContainer = sinon.stub().returns(RefinementList);
    starRating.__Rewire__('autoHideContainerHOC', autoHideContainer);
    headerFooter = sinon.stub().returns(RefinementList);
    starRating.__Rewire__('headerFooterHOC', headerFooter);

    container = document.createElement('div');
    widget = starRating({container, attributeName: 'anAttrName', cssClasses: {body: ['body', 'cx']}});
    helper = {
      clearRefinements: sinon.spy(),
      addDisjunctiveFacetRefinement: sinon.spy(),
      getRefinements: sinon.stub().returns([]),
      search: sinon.spy(),
      setState: sinon.spy()
    };
    state = {
      toggleRefinement: sinon.spy()
    };
    results = {
      getFacetValues: sinon.stub().returns([]),
      hits: []
    };
    createURL = () => '#';
    widget.init({helper});
  });

  it('configures the underlying disjunctive facet', () => {
    expect(widget.getConfiguration()).toEqual({disjunctiveFacets: ['anAttrName']});
  });

  it('calls twice ReactDOM.render(<RefinementList props />, container)', () => {
    widget.render({state, helper, results, createURL});
    widget.render({state, helper, results, createURL});

    const props = {
      cssClasses: {
        active: 'ais-star-rating--item__active',
        body: 'ais-star-rating--body body cx',
        footer: 'ais-star-rating--footer',
        header: 'ais-star-rating--header',
        item: 'ais-star-rating--item',
        count: 'ais-star-rating--count',
        link: 'ais-star-rating--link',
        disabledLink: 'ais-star-rating--link__disabled',
        list: 'ais-star-rating--list',
        star: 'ais-star-rating--star',
        emptyStar: 'ais-star-rating--star__empty',
        root: 'ais-star-rating'
      },
      collapsible: false,
      createURL: () => {},
      facetValues: [
        {isRefined: false, stars: [true, true, true, true, false], count: 0, name: '4', labels: defaultLabels},
        {isRefined: false, stars: [true, true, true, false, false], count: 0, name: '3', labels: defaultLabels},
        {isRefined: false, stars: [true, true, false, false, false], count: 0, name: '2', labels: defaultLabels},
        {isRefined: false, stars: [true, false, false, false, false], count: 0, name: '1', labels: defaultLabels}
      ],
      toggleRefinement: () => {},
      shouldAutoHideContainer: false,
      templateProps: {
        templates: defaultTemplates,
        templatesConfig: undefined,
        transformData: undefined,
        useCustomCompileOptions: {
          footer: false,
          header: false,
          item: false
        }
      }
    };

    expect(ReactDOM.render.calledTwice).toBe(true, 'ReactDOM.render called twice');
    expect(autoHideContainer.calledOnce).toBe(true, 'autoHideContainer called once');
    expect(headerFooter.calledOnce).toBe(true, 'headerFooter called once');
    expect(ReactDOM.render.firstCall.args[0]).toEqualJSX(<RefinementList {...props} />);
    expect(ReactDOM.render.firstCall.args[1]).toEqual(container);
    expect(ReactDOM.render.secondCall.args[0]).toEqualJSX(<RefinementList {...props} />);
    expect(ReactDOM.render.secondCall.args[1]).toEqual(container);
  });

  it('hide the count==0 when there is a refinement', () => {
    helper.getRefinements = sinon.stub().returns([{value: '1'}]);
    results.getFacetValues = sinon.stub().returns([{name: '1', count: 42}]);
    widget.render({state, helper, results, createURL});
    expect(ReactDOM.render.calledOnce).toBe(true, 'ReactDOM.render called once');
    expect(ReactDOM.render.firstCall.args[0].props.facetValues).toEqual([
      {
        count: 42,
        isRefined: true,
        name: '1',
        stars: [true, false, false, false, false],
        labels: defaultLabels
      }
    ]);
  });

  it('doesn\'t call the refinement functions if not refined', () => {
    helper.getRefinements = sinon.stub().returns([]);
    widget.render({state, helper, results, createURL});
    expect(helper.clearRefinements.called).toBe(false, 'clearRefinements never called');
    expect(helper.addDisjunctiveFacetRefinement.called).toBe(false, 'addDisjunctiveFacetRefinement never called');
    expect(helper.search.called).toBe(false, 'search never called');
  });

  it('refines the search', () => {
    helper.getRefinements = sinon.stub().returns([]);
    widget._toggleRefinement('3');
    expect(helper.clearRefinements.calledOnce).toBe(true, 'clearRefinements called once');
    expect(helper.addDisjunctiveFacetRefinement.calledThrice).toBe(true, 'addDisjunctiveFacetRefinement called thrice');
    expect(helper.search.calledOnce).toBe(true, 'search called once');
  });

  it('toggles the refinements', () => {
    helper.getRefinements = sinon.stub().returns([{value: '2'}]);
    widget._toggleRefinement('2');
    expect(helper.clearRefinements.calledOnce).toBe(true, 'clearRefinements called once');
    expect(helper.addDisjunctiveFacetRefinement.called).toBe(false, 'addDisjunctiveFacetRefinement never called');
    expect(helper.search.calledOnce).toBe(true, 'search called once');
  });

  it('toggles the refinements with another facet', () => {
    helper.getRefinements = sinon.stub().returns([{value: '2'}]);
    widget._toggleRefinement('4');
    expect(helper.clearRefinements.calledOnce).toBe(true, 'clearRefinements called once');
    expect(helper.addDisjunctiveFacetRefinement.calledTwice).toBe(true, 'addDisjunctiveFacetRefinement called twice');
    expect(helper.search.calledOnce).toBe(true, 'search called once');
  });

  afterEach(() => {
    starRating.__ResetDependency__('ReactDOM');
    starRating.__ResetDependency__('autoHideContainerHOC');
    starRating.__ResetDependency__('headerFooterHOC');
  });
});
