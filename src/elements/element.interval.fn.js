import {utilsDraw} from '../utils/utils-draw';
import {CSS_PREFIX} from '../const';
const BAR_GROUP = 'i-role-bar-group';
const BAR_GAP = 1;
var getSizesParams = (params) => {
    var countDomainValue = params.domain().length;
    var countCategory = params.categoryLength;
    var tickWidth = params.size / countDomainValue;
    var intervalWidth = tickWidth / (countCategory + 1);
    return {
        tickWidth,
        intervalWidth,
        offsetCategory: intervalWidth
    };
};
var isMeasure = (dim) => (dim.scaleType === 'linear' || dim.scaleType === 'time');
var flipHub = {
    NORM: ({colorScale, node, xScale, yScale, colorIndexScale, width, height, defaultSizeParams}) => {
        let minimalHeight = 1;
        let yMin = Math.min(...yScale.domain());
        let isYNumber = !isNaN(yMin);
        let startValue = (!isYNumber || (yMin <= 0)) ? 0 : yMin;
        let isXNumber = isMeasure(node.x);

        let {tickWidth, intervalWidth, offsetCategory} = isXNumber ?
            defaultSizeParams :
            getSizesParams({
                domain: xScale.domain,
                categoryLength: colorIndexScale.count(),
                size: width
            });

        let gapSize = (intervalWidth > (2 * BAR_GAP)) ? BAR_GAP : 0;

        let calculateX = ({data:d}) => xScale(d[node.x.scaleDim]) - (tickWidth / 2) + gapSize;
        let calculateY = isYNumber ?
            (({data:d}) => {
                var valY = d[node.y.scaleDim];
                var dotY = yScale(Math.max(startValue, valY));
                var h = Math.abs(yScale(valY) - yScale(startValue));
                var isTooSmall = (h < minimalHeight);
                return (isTooSmall && (valY > 0)) ? (dotY - minimalHeight) : dotY;
            }) :
            (({data:d}) => yScale(d[node.y.scaleDim]));

        let calculateWidth = ({data:d}) => (intervalWidth - 2 * gapSize);
        let calculateHeight = isYNumber ?
            (({data:d}) => {
                var valY = d[node.y.scaleDim];
                var h = Math.abs(yScale(valY) - yScale(startValue));
                return (valY === 0) ? h : Math.max(minimalHeight, h);
            }) :
            (({data:d}) => (height - yScale(d[node.y.scaleDim])));

        let calculateTranslate = ({key:d}) =>
            utilsDraw.translate(colorIndexScale({key:d}) * offsetCategory + offsetCategory / 2, 0);

        return {colorScale, calculateX, calculateY, calculateWidth, calculateHeight, calculateTranslate};
    },

    FLIP: ({colorScale, node, xScale, yScale, colorIndexScale, width, height, defaultSizeParams}) => {
        let minimalHeight = 1;
        let xMin = Math.min(...xScale.domain());
        let isXNumber = !isNaN(xMin);
        let startValue = (!isXNumber || (xMin <= 0)) ? 0 : xMin;
        let isYNumber = isMeasure(node.y);

        let {tickWidth, intervalWidth, offsetCategory} = isYNumber ?
            defaultSizeParams :
            getSizesParams({
                domain: yScale.domain,
                categoryLength: colorIndexScale.count(),
                size: height
            });

        let gapSize = (intervalWidth > (2 * BAR_GAP)) ? BAR_GAP : 0;

        let calculateX = isXNumber ?
            (({data:d}) => {
                var valX = d[node.x.scaleDim];
                var h = Math.abs(xScale(valX) - xScale(startValue));
                var dotX = xScale(Math.min(startValue, valX));
                var delta = (h - minimalHeight);
                var offset = (valX > 0) ? (minimalHeight + delta) : ((valX < 0) ? (0 - minimalHeight) : 0);

                var isTooSmall = (delta < 0);
                return (isTooSmall) ? (dotX + offset) : (dotX);
            }) :
            0;
        let calculateY = ({data:d}) => yScale(d[node.y.scaleDim]) - (tickWidth / 2) + gapSize;
        let calculateWidth = isXNumber ?
            (({data:d}) => {
                var valX = d[node.x.scaleDim];
                var h = Math.abs(xScale(valX) - xScale(startValue));
                return (valX === 0) ? h : Math.max(minimalHeight, h);
            }) :
            (({data:d}) => xScale(d[node.x.scaleDim]));
        let calculateHeight = ({data:d}) => (intervalWidth - 2 * gapSize);
        let calculateTranslate = ({key:d}) =>
            utilsDraw.translate(0, colorIndexScale({key:d}) * offsetCategory + offsetCategory / 2);

        return {colorScale, calculateX, calculateY, calculateWidth, calculateHeight, calculateTranslate};
    }
};

function drawInterval({
    calculateX,
    calculateY,
    colorScale,
    calculateWidth,
    calculateHeight,
    calculateTranslate
    },
    container,
    data) {
    var updateBar = function () {
        return this
            .attr('height', calculateHeight)
            .attr('width', calculateWidth)
            .attr('class', ({data:d}) => {
                return `i-role-element i-role-datum bar ${CSS_PREFIX}bar ${colorScale(d[colorScale.scaleDim])}`;
            })
            .attr('x', calculateX)
            .attr('y', calculateY);
    };

    var updateBarContainer = function () {
        this.attr('class', BAR_GROUP)
            .attr('transform', calculateTranslate);
        var bars = this.selectAll('.bar').data((d) => {
            return d.values.map(item => ({
                data: item,
                uid: d.uid
            }));
        });
        bars.call(updateBar);
        bars.enter().append('rect').call(updateBar);
        bars.exit().remove();
    };
    var elements = container.selectAll(`.${BAR_GROUP}`).data(data);
    elements.call(updateBarContainer);
    elements.enter().append('g').call(updateBarContainer);
    elements.exit().remove();
}

export {flipHub, drawInterval};
