import { formatDateShort } from 'lib/helpers/helpers'
import { PostComplete } from 'lib/types/post'
import React from 'react'
import { IconAndLabel } from '../forms/IconAndLabel'

interface PostAddressAndDateTimeProps {
  item: PostComplete
}

export const PostAddressAndDateTime = ({
  item,
}: PostAddressAndDateTimeProps) => {
  return (
    <>
      <div className="d-flex flex-wrap justify-content-start allign-items-center fs-7 text-muted">
        {item.availability.length > 0 && (
          <div className="mb-2 me-4 d-flex align-items-center">
            <i className="fas fa-calendar me-2 "></i>
            {item.availability.map((date, index) => (
              <React.Fragment key={`date-${date.toString()}`}>
                {index > 0 && (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{', '}</div>
                )}
                {date !== null && (
                  <div style={{ whiteSpace: 'nowrap' }}>
                    <span>{formatDateShort(new Date(date))}</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        {item.timeFrom && item.timeTo && (
          <div className="mb-2 me-4">
            <IconAndLabel
              label={`${item.timeFrom} - ${item.timeTo}`}
              icon="fas fa-clock"
            />
          </div>
        )}
        {item.address && (
          <div>
            <IconAndLabel label={item.address} icon="fas fa-map" />
          </div>
        )}
      </div>
    </>
  )
}
