import { GrafanaTheme2, SelectableValue, StandardEditorContext, StandardEditorProps } from '@grafana/data';
import React, { useEffect, useState } from 'react';
import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import { css, cx } from '@emotion/css';
import {
  useStyles2,
  CollapsableSection,
  HorizontalGroup,
  Button,
  IconButton,
  Select,
  Switch,
  Field,
  Label,
  Icon,
  Tooltip,
} from '@grafana/ui';
import { Excalidraw } from '@excalidraw/excalidraw';
import { isEqual } from 'lodash';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';

export type ExcalidrawOptions = {
  rules?: Rule[];
  elements?: ExcalidrawElement[];
};

export type Rule = {
  op: Op | null;
  // dataSource: string | null;
  dataSource: { series: string; field: string } | null;
  // TODO: Add calculation method, refer to gauge panel
  elementId: string | null;
};

export enum Op { // Options: (use threshold)
  ReplaceText, // color
  Stroke, // color, width
  Background, // color, fill style(this is needed cuz it is hidden when transparant)
}
const OpString = Object.keys(Op).filter((v) => isNaN(Number(v)));

function OpSelectOptions() {
  return OpString.map((k, i) => {
    switch (k) {
      case 'ReplaceText':
        return { label: 'Replace Text', value: i } as SelectableValue<Op>;
      case 'Stroke':
        return { label: 'Change Stroke', value: i } as SelectableValue<Op>;
      case 'Background':
        return { label: 'Change Background', value: i } as SelectableValue<Op>;
      default:
        throw new Error('unknown case; should be unreachable');
    }
  });
}
// type OpReplaceText = string;
// type OpStrokeWidth = number;

function getDataSourceOptions(context: StandardEditorContext<any, any>) {
  return context.data
    .map((df) => {
      if (df.refId === undefined) {
        console.log('df.refId was undefined');
      }
      return {
        label: df.refId,
        // value: df.refId,
        options: df.fields.map(
          (f) =>
            ({
              label: f.name,
              value: { series: df.refId ?? '', field: f.name },
            } as SelectableValue<{ series: string; field: string }>)
        ),
      } as SelectableValue<{ series: string; field: string }>;
    })
    .flat();
}

export const ExcalidrawEditor = ({ item, value, onChange, context, id }: StandardEditorProps<ExcalidrawOptions>) => {
  const styles = useStyles2(getStyles);
  const [isBaseOpen, setIsBaseOpen] = useState(false);
  const [isElementsOpen, setIsElementsOpen] = useState(false);
  const [api, setApi] = useState<ExcalidrawImperativeAPI | undefined>();
  const [selectedEl, setSelectedEl] = useState<ExcalidrawElement | null>();
  const [isWatching, setIsWatching] = useState<number | undefined>();

  api?.onPointerUp((_tool, pointer, ev) => {
    setSelectedEl(pointer.hit.element);
  });

  useEffect(() => {
    if (isWatching === undefined || selectedEl == null || value.rules === undefined) {
      return;
    }
    value.rules[isWatching].elementId = selectedEl.id;
    onChange(value);
  }, [selectedEl, value, isWatching, onChange]);

  function _makeLabel(el: ExcalidrawElement | Readonly<{ id: string; type: 'text' | 'arrow' }>) {
    return `${el.type} - ${el.id}`;
  }
  const getElementIdOptions = (i: number) => {
    if (isWatching === i) {
      const out: Array<SelectableValue<string>> = [];
      if (!selectedEl) {
        return out;
      }
      out.push({ label: _makeLabel(selectedEl), value: selectedEl.id });
      const boundEl =
        selectedEl.boundElements?.map((el) => ({ label: _makeLabel(el), value: el.id } as SelectableValue<string>)) ??
        [];
      return [...out, ...boundEl];
    }
    return value.elements
      ?.filter((el) => el.isDeleted !== true)
      .map((el) => ({ label: _makeLabel(el), value: el.id } as SelectableValue<string>));
  };

  // https://github.com/grafana/grafana/blob/bd0fd21852954229c4be9a8243eb8ee372066439/public/app/features/dimensions/editors/ThresholdsEditor/ThresholdsEditor.tsx#L148
  // const ariaLabel = `Threshold ${idx + 1}`;

  return (
    <div>
      <CollapsableSection
        // className={styles.collapse}
        label={'Elements'}
        onToggle={() => setIsElementsOpen(!isElementsOpen)}
        isOpen={isElementsOpen}
      >
        <div>
          <div>
            {value.rules?.length}
            {value.rules?.map((r, i) => (
              <HorizontalGroup key={i}>
                <Field
                  label={
                    <Label>
                      Watch
                      <Tooltip
                        content={'You can enable this, to automatically grab the selected element ID in Excalidraw.'}
                      >
                        <Icon style={{ marginLeft: '4px' }} name="info-circle" />
                      </Tooltip>
                    </Label>
                  }
                >
                  <div style={{ height: '31px', display: 'flex', placeItems: 'center' }}>
                    <Switch
                      value={isWatching === i}
                      onChange={(e) => (e.currentTarget.checked ? setIsWatching(i) : setIsWatching(undefined))}
                    />
                  </div>
                </Field>
                <Field
                  label={
                    <Label>
                      Element ID
                      <Tooltip
                        content={'If watching, then only the selected element and its bound elements will be shown.'}
                      >
                        <Icon style={{ marginLeft: '4px' }} name="info-circle" />
                      </Tooltip>
                    </Label>
                  }
                >
                  {/* <Input
                    value={r.elementId}
                    suffix={
                      <Switch
                        value={isWatching === i}
                        onChange={(e) => (e.currentTarget.checked ? setIsWatching(i) : setIsWatching(undefined))}
                      />
                    }
                    onChange={(e) => {
                      if (!value.rules) {
                        return;
                      }
                      value.rules[i].elementId = e.currentTarget.value;
                      onChange(value);
                    }}
                  /> */}
                  <Select
                    width={20}
                    isClearable
                    options={getElementIdOptions(i)}
                    value={r.elementId}
                    onChange={(selectableValue) => {
                      if (value.rules === undefined) {
                        return;
                      }
                      if (selectableValue === null) {
                        value.rules[i].elementId = null;
                      } else {
                        value.rules[i].elementId = selectableValue.value ?? null;
                      }
                      onChange(value);
                    }}
                  />
                </Field>
                <Field label="Data Source">
                  <Select
                    width={15}
                    isClearable
                    options={getDataSourceOptions(context)}
                    value={r.dataSource}
                    onChange={(selectableValue) => {
                      if (value.rules === undefined) {
                        return;
                      }
                      if (selectableValue === null) {
                        value.rules[i].dataSource = null;
                      } else {
                        value.rules[i].dataSource = selectableValue.value ?? null;
                      }
                      onChange(value);
                    }}
                  />
                </Field>
                <Field label="Operation">
                  <Select
                    width={15}
                    isClearable
                    options={OpSelectOptions()}
                    value={r.op}
                    onChange={(selectableValue) => {
                      if (value.rules === undefined) {
                        return;
                      }
                      if (selectableValue === null) {
                        value.rules[i].op = null;
                      } else {
                        value.rules[i].op = selectableValue.value ?? null;
                      }
                      onChange(value);
                    }}
                  />
                </Field>
                <IconButton
                  className={styles.trashIcon}
                  name="trash-alt"
                  onClick={() => {
                    if (!value.rules) {
                      return;
                    }
                    // const newRules = value.rules.filter((_r, j) => i !== j);
                    value.rules.splice(i, 1);
                    onChange(value);
                  }}
                  // tooltip={`Remove ${ariaLabel}`}
                />
              </HorizontalGroup>
            ))}
          </div>
          <Button
            onClick={() =>
              onChange({
                elements: value.elements,
                rules: [...(value.rules ?? []), { elementId: null, dataSource: null, op: null } as Rule],
              })
            }
          >
            Add Rule
          </Button>
        </div>
      </CollapsableSection>
      <CollapsableSection label={'Base'} onToggle={() => setIsBaseOpen(!isBaseOpen)} isOpen={isBaseOpen}>
        <div
          className={cx(
            styles.wrapper,
            css`
              height: 500px;
            `,
            'custom-excalidraw'
          )}
        >
          <Excalidraw
            excalidrawAPI={(api) => setApi(api)}
            onChange={(el) => {
              if (!isEqual(value?.elements, el)) {
                onChange({ elements: [...el], rules: value.rules });
              }
            }}
            initialData={{
              elements: value?.elements || [],
              scrollToContent: true,
            }}
            theme="dark"
          />
        </div>
      </CollapsableSection>
    </div>
    // <div>
    //   <TextArea value={JSON.stringify(value)} onChange={(v) => trySetElements(v.currentTarget.value)} />
    //   {JSON.stringify(value)}
    //   {/* {JSON.stringify(api?.getSceneElements())} */}
    // </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    trashIcon: css`
      color: ${theme.colors.text.secondary};
      cursor: pointer;
      margin-right: 0;

      &:hover {
        color: ${theme.colors.text};
      }
    `,
    collapse: css({
      backgroundColor: 'unset',
      border: 'unset',
      marginBottom: 0,

      ['> button']: {
        padding: theme.spacing(0, 1),
      },
    }),
    wrapper: css({
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    }),
    title: css({
      flexGrow: 1,
      overflow: 'hidden',
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      margin: 0,
    }),
    description: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.bodySmall.fontWeight,
      paddingLeft: theme.spacing(2),
      gap: theme.spacing(2),
      display: 'flex',
    }),
    body: css({
      display: 'flex',
      gap: theme.spacing(2),
      flexWrap: 'wrap',
    }),
  };
};
