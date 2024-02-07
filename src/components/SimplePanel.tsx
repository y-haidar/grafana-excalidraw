import React, { useEffect, useState } from 'react';
import { FieldConfigSource, PanelData, PanelProps, ThresholdsMode } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css, cx } from '@emotion/css';
import { useStyles2 } from '@grafana/ui';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Op, Rule } from './SimpleEditor';
import { ThresholdsConfig } from '@grafana/schema';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
// import { setExcalirawApi } from './Store';

interface Props extends PanelProps<SimpleOptions> {}

export const SimplePanel: React.FC<Props> = ({ options, data, width, height, id, fieldConfig }) => {
  // const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | undefined>();

  useEffect(() => {
    if (!api) {
      return;
    }
    const elements = [...(options.excalidrawOptions?.elements ?? [])];

    options.excalidrawOptions?.rules?.forEach((r) => {
      if (r.op === null) {
        return;
      }
      switch (r.op) {
        case Op.ReplaceText:
          // TODO
          return;
        case Op.Stroke:
          // TODO
          return;
        case Op.Background:
          try {
            if (!options.excalidrawOptions?.elements) {
              return;
            }
            const index = elements.findIndex((el) => el.id === r.elementId);
            if (index === undefined || index < 0) {
              return;
            }
            if (!elements[index]?.backgroundColor) {
              return;
            }
            const color = calculateColor(r, data, fieldConfig);
            // console.log(color);
            elements[index] = {
              ...elements[index],
              backgroundColor: color,
            };
          } catch (e) {
            // eslint-disable-next-line no-console
            console.debug(e);
            return;
          }
          return;
        default:
          throw new Error('unknown case; should be unreachable');
      }
    });
    api.updateScene({ elements });
  }, [api, data, fieldConfig, options]);

  // onOptionsChange()

  return (
    <div
      className={cx(
        styles.wrapper,
        css`
          width: ${width}px;
          height: ${height}px;
        `,
        styles['custom-excalidraw']
      )}
    >
      <Excalidraw
        excalidrawAPI={(api) => setApi(api)}
        // excalidrawAPI={(api) => $ExcalirawApi.setKey(id, api)}
        // onChange={(el) => $ExcalidrawElements.setKey(id, [...el])}
        initialData={{
          elements: options.excalidrawOptions?.elements,
          scrollToContent: true,
        }}
        theme="dark"
        viewModeEnabled
      />
    </div>
  );
};

function getLastValue(r: Rule, data: PanelData) {
  const df = data.series.filter((df) => df.refId === r.dataSource?.series).pop();
  if (df === undefined) {
    throw new Error('selected series refId not found');
  }
  const field = df.fields.filter((f) => f.name === r.dataSource?.field).pop();
  if (field === undefined) {
    throw new Error('selected field name not found');
  }
  const value = field.values.at(-1);
  if (value === undefined || value === null) {
    throw new Error('no values found in df->field');
  }
  return value;
}

function calculateColor(r: Rule, data: PanelData, fieldConfig: FieldConfigSource<any>) {
  // using `find` so only the first matching will be returned
  const override = fieldConfig.overrides.find((ov) => {
    if (ov.matcher.id !== 'byName') {
      return false;
    }
    if (r.dataSource?.field === undefined || r.dataSource?.field === null) {
      return false;
    }
    return ov.matcher.options === r.dataSource?.field;
  });
  // TODO: support LastNonNullValue, and maybe average and other aggregates?
  // TODO: support Min, Max, from standard options
  // TODO: support percentage mode
  const value = getLastValue(r, data);
  if (override !== undefined) {
    const thresholds = override.properties.find((p) => p.id === 'thresholds')?.value as ThresholdsConfig;
    if (thresholds === undefined) {
      throw new Error('an override was defined, but threshold is missing');
    }
    if (thresholds.mode !== ThresholdsMode.Absolute) {
      throw new Error(`Not supported method ${thresholds.mode}`);
    }
    const threshold = thresholds.steps
      .slice(1)
      .reverse()
      .find((threshold) => value >= (threshold.value ?? -Infinity));
    if (threshold === undefined) {
      return thresholds.steps[0].color;
    }
    return threshold.color;
  }
  if (fieldConfig.defaults.thresholds?.mode !== ThresholdsMode.Absolute) {
    throw new Error(`Not supported method ${fieldConfig.defaults.thresholds?.mode}`);
  }
  const threshold = fieldConfig.defaults.thresholds.steps
    .slice(1)
    .reverse()
    .find((threshold) => value >= threshold.value);
  if (threshold === undefined) {
    return fieldConfig.defaults.thresholds.steps[0].color;
  }
  return threshold.color;
}

const getStyles = () => {
  return {
    wrapper: css`
      font-family: Open Sans;
      position: relative;
    `,
    svg: css`
      position: absolute;
      top: 0;
      left: 0;
    `,
    textBox: css`
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
    `,
    'custom-excalidraw': css`
      .App-toolbar {
        display: none;
      }
      .App-menu_top {
        display: none !important;
      }
    `,
  };
};
