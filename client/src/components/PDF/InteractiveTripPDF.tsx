import React from 'react'
import { Document, Link, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import type { AssignmentsMap, Category, Day, DayNote, Place, Trip } from '../../types'
import { getGoogleMapsUrlForPlace } from '../Planner/placeGoogleMaps'

type Props = {
  trip: Trip
  days: Day[]
  assignments: AssignmentsMap
  categories: Category[]
  dayNotes: DayNote[]
  locale: string
}

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Helvetica', color: '#172033', fontSize: 10 },
  cover: { justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#64748b', fontSize: 12, textAlign: 'center' },
  day: { marginBottom: 20 },
  dayHeader: { backgroundColor: '#0f172a', color: '#ffffff', padding: 10, borderRadius: 5, marginBottom: 9 },
  dayTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold' },
  dayDate: { fontSize: 9, color: '#cbd5e1', marginTop: 2 },
  overview: { borderLeftWidth: 3, borderLeftColor: '#03398f', backgroundColor: '#eff6ff', padding: 8, marginBottom: 8 },
  overviewLabel: { color: '#03398f', fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  overviewText: { color: '#1e3a5f', lineHeight: 1.4 },
  note: { borderLeftWidth: 3, borderLeftColor: '#94a3b8', backgroundColor: '#f8fafc', padding: 7, marginBottom: 6 },
  noteText: { color: '#334155', lineHeight: 1.4 },
  noteMeta: { color: '#64748b', fontSize: 8, marginTop: 2 },
  place: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 5, padding: 8, marginBottom: 7 },
  placeRow: { flexDirection: 'row', alignItems: 'center' },
  number: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#1e293b', color: '#fff', fontSize: 8, textAlign: 'center', paddingTop: 3, marginRight: 6 },
  placeName: { color: '#03398f', fontSize: 11, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', flex: 1 },
  category: { color: '#64748b', fontSize: 8, marginTop: 4, marginLeft: 22 },
  address: { color: '#64748b', fontSize: 9, marginTop: 3, marginLeft: 22 },
  description: { color: '#475569', fontSize: 9, marginTop: 3, marginLeft: 22, lineHeight: 1.35 },
  mapLabel: { color: '#0369a1', fontSize: 8, marginTop: 4, marginLeft: 22 },
})

function dateForPdf(date: string | null | undefined, locale: string) {
  if (!date) return ''
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(locale || 'en', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function InteractiveTripDocument({ trip, days, assignments, categories, dayNotes, locale }: Props) {
  const sortedDays = [...days].sort((a, b) => (a.day_number || 0) - (b.day_number || 0))
  return (
    <Document title={`${trip.title || 'Trip'} itinerary`} author="TREK">
      <Page size="A4" style={[styles.page, styles.cover]}>
        <Text style={styles.title}>{trip.title || 'Travel plan'}</Text>
        {trip.description ? <Text style={styles.subtitle}>{trip.description}</Text> : null}
        <Text style={[styles.subtitle, { marginTop: 12 }]}>{sortedDays.length} planned days</Text>
      </Page>
      {sortedDays.map((day) => {
        const items = [
          ...(assignments[String(day.id)] || []).map(a => ({ type: 'place' as const, order: a.order_index ?? 0, data: a.place })),
          ...dayNotes.filter(note => note.day_id === day.id).map(note => ({ type: 'note' as const, order: note.sort_order ?? 0, data: note })),
        ].sort((a, b) => a.order - b.order)
        let placeNumber = 0
        return (
          <Page key={day.id} size="A4" style={styles.page}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day.title || `Day ${day.day_number}`}</Text>
              {day.date ? <Text style={styles.dayDate}>{dateForPdf(day.date, locale)}</Text> : null}
            </View>
            {day.notes?.trim() ? <View style={styles.overview}><Text style={styles.overviewLabel}>DAY NOTE</Text><Text style={styles.overviewText}>{day.notes}</Text></View> : null}
            {items.length === 0 ? <Text style={styles.noteMeta}>No places planned for this day.</Text> : items.map((item, index) => {
              if (item.type === 'note') return <View key={`note-${item.data.id}-${index}`} style={styles.note}><Text style={styles.noteText}>{item.data.text}</Text>{item.data.time ? <Text style={styles.noteMeta}>{item.data.time}</Text> : null}</View>
              const place = item.data
              if (!place) return null
              placeNumber += 1
              const category = categories.find(c => c.id === place.category_id)
              const mapsUrl = getGoogleMapsUrlForPlace(place)
              const name = <Text style={styles.placeName}>{place.name}</Text>
              return <View key={`place-${place.id}-${index}`} style={styles.place} wrap={false}>
                <View style={styles.placeRow}><Text style={styles.number}>{placeNumber}</Text>{mapsUrl ? <Link src={mapsUrl}>{name}</Link> : name}</View>
                {category ? <Text style={styles.category}>{category.name}</Text> : null}
                {place.address ? <Text style={styles.address}>{place.address}</Text> : null}
                {place.description ? <Text style={styles.description}>{place.description}</Text> : null}
                {mapsUrl ? <Link src={mapsUrl} style={styles.mapLabel}>Open in Google Maps</Link> : null}
              </View>
            })}
          </Page>
        )
      })}
    </Document>
  )
}

export async function downloadInteractiveTripPDF(props: Props) {
  const blob = await pdf(<InteractiveTripDocument {...props} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${(props.trip.title || 'trip').replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'trip'}-itinerary.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
