import React from 'react'

export interface RowContentsInterface {
  label: string | JSX.Element
  content: string | JSX.Element
  show?: boolean
}

interface RowContentProps {
  data: RowContentsInterface[]
}

export const RowContent = ({ data }: RowContentProps) => {
  return (
    <>
      {data.map(
        (item, index) =>
          item.content &&
          !item.show && (
            <div key={index}>
              <div className="smj-light-grey">
                <div className="ms-4">
                  {typeof item.content === 'string' ? (
                    <strong>{item.label}:</strong>
                  ) : (
                    <div>{item.label}</div>
                  )}
                </div>
              </div>
              <div className="ms-5">
                {typeof item.content === 'string' ? (
                  <p>{item.content}</p>
                ) : (
                  <div>{item.content}</div>
                )}
              </div>
            </div>
          )
      )}
    </>
  )
}
